import { Schema, model, type Document, type Model, Types } from 'mongoose';

import { StyleMode } from '../types/image.types';

/** A single generated image, owned by a user. */
export interface IImage extends Document {
  user: Types.ObjectId;
  prompt: string;
  style: StyleMode;
  url: string;
  publicId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<IImage>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    prompt: { type: String, required: true, trim: true },
    style: {
      type: String,
      enum: Object.values(StyleMode),
      required: true,
    },
    url: { type: String, required: true },
    publicId: { type: String, default: null },
  },
  { timestamps: true },
);

export const Image: Model<IImage> = model<IImage>('Image', imageSchema);
export default Image;
