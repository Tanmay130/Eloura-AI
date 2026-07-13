import type { Request, Response } from 'express';

import { User } from '../models/User';
import { Image, type IImage } from '../models/Image';
import { generateImage } from '../services/imageService';
import { storeImage, destroyImage } from '../services/cloudinaryService';
import {
  StyleMode,
  type GenerateImageBody,
  type GenerateImageSuccess,
  type ImageView,
  type ImageListSuccess,
} from '../types/image.types';

/** Structured error body. `code` lets the client branch without string-matching. */
interface ErrorBody {
  error: string;
  code?: 'INSUFFICIENT_CREDITS';
}

interface DeleteSuccess {
  success: true;
}

const MIN_PROMPT_LENGTH = 3;
const VALID_STYLES = new Set<StyleMode>(Object.values(StyleMode));

/** Map a Mongoose Image document to the sanitized client view. */
function toImageView(image: IImage): ImageView {
  return {
    id: String(image._id),
    prompt: image.prompt,
    style: image.style,
    url: image.url,
    createdAt: image.createdAt.toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*  POST /api/images/generate   (auth-protected, credit-metered)               */
/* -------------------------------------------------------------------------- */

export async function generate(
  req: Request<unknown, unknown, GenerateImageBody>,
  res: Response<GenerateImageSuccess | ErrorBody>,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    const { prompt, style } = req.body;

    if (!prompt || prompt.trim().length < MIN_PROMPT_LENGTH) {
      res.status(400).json({ error: `Prompt must be at least ${MIN_PROMPT_LENGTH} characters` });
      return;
    }
    if (!style || !VALID_STYLES.has(style)) {
      res.status(400).json({ error: 'A valid style mode is required (ANIME, REALISTIC, CINEMATIC)' });
      return;
    }

    // ---- Atomically reserve one credit (concurrency-safe) ----
    const reserved = await User.findOneAndUpdate(
      { _id: req.user.id, credits: { $gte: 1 } },
      { $inc: { credits: -1 } },
      { new: true },
    );

    if (!reserved) {
      const exists = await User.exists({ _id: req.user.id });
      if (!exists) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.status(403).json({
        error: 'You are out of credits. Upgrade your plan to keep generating.',
        code: 'INSUFFICIENT_CREDITS',
      });
      return;
    }

    // ---- Generate, persist to CDN + history. Refund on any failure. ----
    const trimmedPrompt = prompt.trim();
    try {
      const result = await generateImage(trimmedPrompt, style);
      const stored = await storeImage(result.url);

      await Image.create({
        user: reserved._id,
        prompt: trimmedPrompt,
        style,
        url: stored.url,
        publicId: stored.publicId,
      });

      res.status(200).json({
        imageUrl: stored.url,
        prompt: trimmedPrompt,
        style,
        credits: reserved.credits,
      });
    } catch (genErr: unknown) {
      await User.updateOne({ _id: req.user.id }, { $inc: { credits: 1 } });
      throw genErr;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Image generation failed';
    res.status(500).json({ error: message });
  }
}

/* -------------------------------------------------------------------------- */
/*  GET /api/images   (auth-protected) — the signed-in user's history          */
/* -------------------------------------------------------------------------- */

export async function listImages(
  req: Request,
  res: Response<ImageListSuccess | ErrorBody>,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }
    const images = await Image.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ images: images.map(toImageView) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load history';
    res.status(500).json({ error: message });
  }
}

/* -------------------------------------------------------------------------- */
/*  DELETE /api/images/:id   (auth-protected) — delete one owned image         */
/* -------------------------------------------------------------------------- */

export async function remove(
  req: Request<{ id: string }>,
  res: Response<DeleteSuccess | ErrorBody>,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    // Ownership is enforced in the query itself — a user can only match
    // images that belong to them.
    const image = await Image.findOne({ _id: req.params.id, user: req.user.id });
    if (!image) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    await destroyImage(image.publicId);
    await image.deleteOne();

    res.status(200).json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete image';
    res.status(500).json({ error: message });
  }
}
