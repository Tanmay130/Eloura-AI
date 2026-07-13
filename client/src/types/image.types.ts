/** Generation styles — mirrors the server's StyleMode enum. */
export enum StyleMode {
  ANIME = 'ANIME',
  REALISTIC = 'REALISTIC',
  CINEMATIC = 'CINEMATIC',
}

/** Human-readable labels for each style chip. */
export const STYLE_LABELS: Record<StyleMode, string> = {
  [StyleMode.REALISTIC]: 'Realistic',
  [StyleMode.CINEMATIC]: 'Cinematic',
  [StyleMode.ANIME]: 'Anime',
};

/** Successful response from POST /api/images/generate. */
export interface GenerateImageResponse {
  imageUrl: string;
  prompt: string;
  style: StyleMode;
  credits: number;
}

/** A stored image as returned by GET /api/images. */
export interface ImageRecord {
  id: string;
  prompt: string;
  style: StyleMode;
  url: string;
  createdAt: string;
}

/** Response from GET /api/images. */
export interface ImageListResponse {
  images: ImageRecord[];
}

/** A few starter prompts shown in the studio's empty state. */
export const EXAMPLE_PROMPTS: readonly string[] = [
  'A serene mountain lake at golden hour, mist rising off the water',
  'A neon-lit cyberpunk street market in the rain',
  'A cozy reading nook by a rain-streaked window, warm light',
  'An astronaut relaxing on a beach on a distant planet',
];
