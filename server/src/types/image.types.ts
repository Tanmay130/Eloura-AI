/** The generation styles Eloura AI supports. */
export enum StyleMode {
  ANIME = 'ANIME',
  REALISTIC = 'REALISTIC',
  CINEMATIC = 'CINEMATIC',
}

/** Body accepted by POST /api/images/generate. */
export interface GenerateImageBody {
  prompt?: string;
  style?: StyleMode;
}

/** Successful generation response. Includes the user's remaining credits. */
export interface GenerateImageSuccess {
  imageUrl: string;
  prompt: string;
  style: StyleMode;
  credits: number;
}

/** Sanitized image record sent to the client (never leaks _id/__v/publicId). */
export interface ImageView {
  id: string;
  prompt: string;
  style: StyleMode;
  url: string;
  createdAt: string;
}

/** Response for GET /api/images. */
export interface ImageListSuccess {
  images: ImageView[];
}
