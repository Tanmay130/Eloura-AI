import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';

/* -------------------------------------------------------------------------- */
/*  Motion presets — explicit spring physics, never generic tweens            */
/* -------------------------------------------------------------------------- */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 20, mass: 0.6 },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/* -------------------------------------------------------------------------- */
/*  Inline, dependency-free icons (typed as ReactNode)                         */
/* -------------------------------------------------------------------------- */

function IconBolt(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" strokeLinejoin="round" />
    </svg>
  );
}
function IconLayers(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="m12 3 9 5-9 5-9-5 9-5Z" strokeLinejoin="round" />
      <path d="m3 13 9 5 9-5" strokeLinejoin="round" />
    </svg>
  );
}
function IconShield(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6l-8-3Z" strokeLinejoin="round" />
    </svg>
  );
}
function IconSparkle(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M12 3v6m0 6v6m9-9h-6m-6 0H3" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Feature card                                                               */
/* -------------------------------------------------------------------------- */

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps): JSX.Element {
  return (
    <motion.div
      variants={fadeUp}
      className="group relative rounded-2xl border border-neutral-800/60 bg-neutral-950/40 backdrop-blur-md p-6 transition-colors duration-300 hover:border-neutral-600"
    >
      {/* Soft border-glow that illuminates on hover (Vercel-style) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(140px 140px at 50% 0%, rgba(129,140,248,0.20), transparent 70%)',
        }}
      />
      <div className="relative">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800/60 bg-neutral-900/60 text-neutral-300 transition-colors duration-300 group-hover:border-neutral-600 group-hover:text-white">
          {icon}
        </div>
        <h3 className="mt-5 text-base font-semibold text-neutral-100">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">{description}</p>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pricing card                                                               */
/* -------------------------------------------------------------------------- */

interface PriceCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: readonly string[];
  cta: string;
  highlighted?: boolean;
}

function PriceCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  highlighted = false,
}: PriceCardProps): JSX.Element {
  return (
    <motion.div
      variants={fadeUp}
      className={[
        'relative rounded-2xl border p-7 backdrop-blur-md transition',
        highlighted
          ? 'border-neutral-600 bg-neutral-900/60 shadow-[0_0_60px_-15px_rgba(255,255,255,0.15)]'
          : 'border-neutral-800/60 bg-neutral-950/40 hover:border-neutral-700',
      ].join(' ')}
    >
      {highlighted && (
        <span className="absolute -top-3 left-7 rounded-full border border-neutral-700 bg-white px-3 py-0.5 text-xs font-medium text-black">
          Most popular
        </span>
      )}
      <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-400">{name}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-white">{price}</span>
        <span className="text-sm text-neutral-500">{period}</span>
      </div>
      <p className="mt-3 text-sm text-neutral-400">{description}</p>

      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-neutral-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-4 w-4 text-neutral-500">
              <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <Link
        to="/signup"
        className={[
          'mt-8 block rounded-lg py-2.5 text-center text-sm font-medium transition',
          highlighted
            ? 'bg-white text-black hover:bg-neutral-200'
            : 'border border-neutral-800 text-neutral-200 hover:border-neutral-600 hover:text-white',
        ].join(' ')}
      >
        {cta}
      </Link>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page data                                                                  */
/* -------------------------------------------------------------------------- */

const FEATURES: readonly FeatureCardProps[] = [
  {
    icon: <IconBolt />,
    title: 'Instant generation',
    description: 'Turn a prompt into a finished image in seconds with GPU-accelerated pipelines.',
  },
  {
    icon: <IconLayers />,
    title: 'Multiple styles',
    description: 'Switch between cinematic, realistic, and anime modes without leaving the studio.',
  },
  {
    icon: <IconShield />,
    title: 'Type-safe & secure',
    description: 'JWT-authenticated, strictly-typed APIs keep your account and assets protected.',
  },
  {
    icon: <IconSparkle />,
    title: 'Credit-based fairness',
    description: 'Pay only for what you generate. Every account starts with 10 free credits.',
  },
];

const PLANS: readonly PriceCardProps[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'For trying things out.',
    features: ['10 credits included', 'Standard generation speed', 'Community support'],
    cta: 'Start for free',
  },
  {
    name: 'Plus',
    price: '$12',
    period: '/mo',
    description: 'For regular creators.',
    features: ['500 credits / month', 'Priority generation queue', 'All style modes', 'Email support'],
    cta: 'Upgrade to Plus',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '$39',
    period: '/mo',
    description: 'For studios and teams.',
    features: ['2,000 credits / month', 'Fastest generation', 'Commercial license', 'Priority support'],
    cta: 'Go Pro',
  },
];

/* -------------------------------------------------------------------------- */
/*  Landing page                                                               */
/* -------------------------------------------------------------------------- */

export function LandingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-[#030303] text-neutral-100 antialiased">
      {/* Navigation */}
      <header className="sticky top-0 z-20 border-b border-neutral-800/60 bg-[#030303]/70 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">Eloura AI</span>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/login" className="text-neutral-300 transition hover:text-white">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-white px-4 py-2 font-medium text-black transition hover:bg-neutral-200"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle grid pattern — faded toward the edges for depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(70% 60% at 50% 0%, #000 35%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(70% 60% at 50% 0%, #000 35%, transparent 100%)',
          }}
        />
        {/* Radial glow backdrop — slow, breathing pulse */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 0%, rgba(99,102,241,0.22) 0%, rgba(3,3,3,0) 70%)',
          }}
          animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.06, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative mx-auto max-w-4xl px-6 pt-28 pb-24 text-center"
        >
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-800/60 bg-neutral-950/40 px-3.5 py-1.5 text-xs text-neutral-400 backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Now in early access
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="mt-8 text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl"
          >
            <span className="bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
              Imagine it. Eloura renders it.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-400"
          >
            A production-grade AI image studio. Type a prompt, pick a style, and generate
            stunning visuals in seconds — all with a fair, credit-based model.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex items-center justify-center gap-4">
            {/* Glowing CTA */}
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500/50 to-fuchsia-500/50 blur-lg"
              />
              <Link
                to="/signup"
                className="relative inline-flex items-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                Start generating free
              </Link>
            </div>
            <Link
              to="/login"
              className="rounded-xl border border-neutral-800/60 px-6 py-3 text-sm font-medium text-neutral-200 transition hover:border-neutral-600 hover:text-white"
            >
              Sign in
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to create
          </h2>
          <p className="mt-4 text-neutral-400">
            Built on a strict TypeScript stack for speed, safety, and scale.
          </p>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </motion.div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, honest pricing</h2>
          <p className="mt-4 text-neutral-400">Start free. Upgrade only when you need more credits.</p>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {PLANS.map((plan) => (
            <PriceCard key={plan.name} {...plan} />
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <span className="text-sm font-semibold tracking-tight text-neutral-200">Eloura AI</span>
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} Eloura AI. Built with a strict TypeScript MERN stack.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
