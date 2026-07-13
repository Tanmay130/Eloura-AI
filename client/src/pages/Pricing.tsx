import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';

import { useAuth } from '../context/AuthContext';
import api, { getApiErrorMessage } from '../lib/api';
import { Spinner } from '../components/Spinner';
import type {
  CreateOrderResponse,
  VerifyResponse,
  RazorpayOptions,
  RazorpaySuccessResponse,
} from '../types/payment.types';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 20 },
  },
};

interface PlanTier {
  name: string;
  planId: string | null; // null = the free tier, not purchasable
  price: string;
  period: string;
  description: string;
  features: readonly string[];
  cta: string;
  highlighted?: boolean;
}

const PLANS: readonly PlanTier[] = [
  {
    name: 'Free',
    planId: null,
    price: '₹0',
    period: '/mo',
    description: 'For trying things out.',
    features: ['10 credits included', 'Standard generation speed', 'Community support'],
    cta: 'Current plan',
  },
  {
    name: 'Plus',
    planId: 'plus',
    price: '₹999',
    period: '/mo',
    description: 'For regular creators.',
    features: ['500 credits', 'Priority generation queue', 'All style modes', 'Email support'],
    cta: 'Upgrade to Plus',
    highlighted: true,
  },
  {
    name: 'Pro',
    planId: 'pro',
    price: '₹2,999',
    period: '/mo',
    description: 'For studios and teams.',
    features: ['2,000 credits', 'Fastest generation', 'Commercial license', 'Priority support'],
    cta: 'Go Pro',
  },
];

export function Pricing(): JSX.Element {
  const { user, patchUser } = useAuth();
  const navigate = useNavigate();

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const outOfCredits = (user?.credits ?? 0) <= 0;

  async function completePayment(
    response: RazorpaySuccessResponse,
    planId: string,
  ): Promise<void> {
    try {
      const { data } = await api.post<VerifyResponse>('/payments/verify', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        planId,
      });
      patchUser({ credits: data.credits, plan: data.plan });
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    }
  }

  async function handleCheckout(planId: string): Promise<void> {
    setError(null);

    if (typeof window.Razorpay === 'undefined') {
      setError('Payment SDK failed to load. Check your connection and refresh.');
      return;
    }

    setLoadingPlan(planId);
    try {
      const { data } = await api.post<CreateOrderResponse>('/payments/order', { planId });

      const options: RazorpayOptions = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Eloura AI',
        description: `Eloura ${planId} plan`,
        order_id: data.orderId,
        prefill: { name: user?.name ?? '', email: user?.email ?? '' },
        theme: { color: '#6366f1' },
        handler: (response) => {
          void completePayment(response, planId);
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#030303] text-neutral-100">
      <nav className="flex items-center justify-between border-b border-neutral-800/60 px-6 py-4">
        <Link to="/dashboard" className="font-semibold tracking-tight">
          Eloura AI
        </Link>
        <Link
          to="/dashboard"
          className="rounded-lg border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-neutral-600 hover:text-white"
        >
          Back to Studio
        </Link>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-16">
        {outOfCredits && (
          <div className="mx-auto mb-10 max-w-xl rounded-xl border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-center text-sm text-amber-300">
            You&apos;re out of credits. Upgrade a plan below to keep generating.
          </div>
        )}

        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Choose your plan</h1>
          <p className="mt-4 text-neutral-400">Start free. Upgrade only when you need more credits.</p>
        </div>

        {error && (
          <p className="mx-auto mt-8 max-w-xl rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-center text-sm text-red-400">
            {error}
          </p>
        )}

        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.08 }}
          className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {PLANS.map((plan) => {
            const isFree = plan.planId === null;
            const isLoading = loadingPlan === plan.planId;
            return (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                className={[
                  'relative rounded-2xl border p-7 backdrop-blur-md transition',
                  plan.highlighted
                    ? 'border-neutral-600 bg-neutral-900/60 shadow-[0_0_60px_-15px_rgba(255,255,255,0.15)]'
                    : 'border-neutral-800/60 bg-neutral-950/40 hover:border-neutral-700',
                ].join(' ')}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-7 rounded-full border border-neutral-700 bg-white px-3 py-0.5 text-xs font-medium text-black">
                    Most popular
                  </span>
                )}
                <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-400">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-white">{plan.price}</span>
                  <span className="text-sm text-neutral-500">{plan.period}</span>
                </div>
                <p className="mt-3 text-sm text-neutral-400">{plan.description}</p>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-neutral-300">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-4 w-4 text-neutral-500">
                        <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={isFree || isLoading}
                  onClick={() => {
                    if (plan.planId) {
                      void handleCheckout(plan.planId);
                    }
                  }}
                  className={[
                    'mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-center text-sm font-medium transition',
                    plan.highlighted
                      ? 'bg-white text-black hover:bg-neutral-200'
                      : 'border border-neutral-800 text-neutral-200 hover:border-neutral-600 hover:text-white',
                    isFree ? 'cursor-not-allowed opacity-50' : '',
                  ].join(' ')}
                >
                  {isLoading && <Spinner />}
                  {isLoading ? 'Opening…' : plan.cta}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </main>
  );
}

export default Pricing;
