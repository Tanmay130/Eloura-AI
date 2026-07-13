import { Schema, model, type Document, type Model, Types } from 'mongoose';

/**
 * A processed payment. `paymentId` is unique — this collection is what makes
 * crediting idempotent (the same Razorpay payment can never be credited twice).
 */
export interface IPayment extends Document {
  user: Types.ObjectId;
  paymentId: string;
  orderId: string;
  plan: string;
  credits: number;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentId: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    plan: { type: String, required: true },
    credits: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true },
);

export const Payment: Model<IPayment> = model<IPayment>('Payment', paymentSchema);
export default Payment;
