import { motion, type Transition } from 'framer-motion';

interface MeshGlowProps {
  /** When true the glow is brighter and faster — used during AI generation. */
  active?: boolean;
  className?: string;
}

interface Blob {
  color: string;
  size: string;
  left: string;
  top: string;
  x: [string, string, string];
  y: [string, string, string];
  duration: number;
}

const BLOBS: readonly Blob[] = [
  {
    color: 'rgba(99,102,241,0.55)', // indigo
    size: 'h-64 w-64',
    left: '10%',
    top: '20%',
    x: ['-15%', '35%', '-15%'],
    y: ['-10%', '25%', '-10%'],
    duration: 9,
  },
  {
    color: 'rgba(217,70,239,0.45)', // fuchsia
    size: 'h-72 w-72',
    left: '55%',
    top: '10%',
    x: ['20%', '-25%', '20%'],
    y: ['10%', '35%', '10%'],
    duration: 11,
  },
  {
    color: 'rgba(34,211,238,0.35)', // cyan
    size: 'h-56 w-56',
    left: '35%',
    top: '45%',
    x: ['-10%', '25%', '-10%'],
    y: ['15%', '-20%', '15%'],
    duration: 13,
  },
];

/**
 * A shifting radial mesh-gradient glow field (Apple-Intelligence style).
 * Several blurred colored blobs drift on independent loops, creating a fluid,
 * non-distracting ambient glow behind a container.
 */
export function MeshGlow({ active = false, className = '' }: MeshGlowProps): JSX.Element {
  const baseOpacity = active ? 0.55 : 0.28;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {BLOBS.map((blob, index) => {
        const transition: Transition = {
          duration: active ? blob.duration * 0.6 : blob.duration,
          repeat: Infinity,
          ease: 'easeInOut',
        };
        return (
          <motion.div
            key={`blob-${index}`}
            className={`absolute rounded-full blur-3xl ${blob.size}`}
            style={{
              left: blob.left,
              top: blob.top,
              background: `radial-gradient(circle, ${blob.color}, transparent 70%)`,
            }}
            animate={{
              x: blob.x,
              y: blob.y,
              opacity: [baseOpacity, baseOpacity + 0.2, baseOpacity],
            }}
            transition={transition}
          />
        );
      })}
    </div>
  );
}

export default MeshGlow;
