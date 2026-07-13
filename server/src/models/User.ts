import { Schema, model, type Document, type Model } from 'mongoose';

/** The three subscription tiers Eloura AI offers. */
export type UserPlan = 'free' | 'plus' | 'pro';

/**
 * Application-level shape of a User document. Extends Mongoose `Document`
 * so instances carry `_id`, `id`, timestamps, and document methods while
 * remaining strongly typed throughout the codebase.
 */
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  credits: number;
  plan: UserPlan;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      // Excluded from query results by default; explicitly re-select on login.
      select: false,
    },
    credits: {
      type: Number,
      default: 10,
      min: 0,
    },
    plan: {
      type: String,
      enum: ['free', 'plus', 'pro'],
      default: 'free',
    },
  },
  { timestamps: true },
);

export const User: Model<IUser> = model<IUser>('User', userSchema);
export default User;
