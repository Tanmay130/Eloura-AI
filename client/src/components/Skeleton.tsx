interface SkeletonProps {
  /** Sizing / shape classes, e.g. "h-64 w-full rounded-2xl". */
  className?: string;
}

/**
 * A shimmering skeleton placeholder (Raycast-style). A soft highlight sweeps
 * across a muted base via the `animate-shimmer` keyframe defined in Tailwind.
 */
export function Skeleton({ className = '' }: SkeletonProps): JSX.Element {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-neutral-800/60 bg-neutral-900/50 ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export default Skeleton;
