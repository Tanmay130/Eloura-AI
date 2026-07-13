import { useState, type ReactNode, type MouseEvent } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  /** Radial glow color (rgba). Defaults to a soft indigo. */
  glowColor?: string;
}

interface GlowPosition {
  x: number;
  y: number;
}

/**
 * A container whose border/surface illuminates with a radial glow that follows
 * the cursor (Vercel/Raycast style). The glow fades in on hover and tracks the
 * mouse via onMouseMove — all strictly typed.
 */
export function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(129,140,248,0.22)',
}: GlowCardProps): JSX.Element {
  const [position, setPosition] = useState<GlowPosition>({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<boolean>(false);

  function handleMouseMove(event: MouseEvent<HTMLDivElement>): void {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative overflow-hidden rounded-2xl border transition-colors duration-300 ${
        hovered ? 'border-neutral-600' : 'border-neutral-800/60'
      } ${className}`}
    >
      {/* Cursor-following glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(220px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 65%)`,
        }}
      />
      {children}
    </div>
  );
}

export default GlowCard;
