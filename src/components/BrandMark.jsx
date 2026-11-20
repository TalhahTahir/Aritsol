/**
 * The ARTISOL mark: an "A" drawn as a gable with a gold crossbar.
 * The crossbar is the brand's signature element: it fills as the loader's
 * progress bar and leads every page transition.
 *
 *   ink:      colour of the two strokes (defaults to the current text colour)
 *   bar:      0–1, how much of the gold crossbar is drawn
 *   draw:     animate the strokes drawing in (used by the loader)
 */
export default function BrandMark({ size = 30, ink = 'currentColor', bar = 1, draw = false, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M12 55 32 9l20 46"
        fill="none"
        stroke={ink}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
        style={draw ? { strokeDasharray: 1, strokeDashoffset: 1, animation: 'brand-draw 1s cubic-bezier(0.65,0,0.35,1) 0.15s forwards' } : undefined}
      />
      <path
        d="M20.5 39h23"
        fill="none"
        stroke="var(--brand-gold)"
        strokeWidth="7"
        strokeLinecap="round"
        style={{ transformBox: 'fill-box', transformOrigin: 'left center', transform: `scaleX(${Math.max(0.001, bar)})`, transition: 'transform 0.25s ease-out' }}
      />
    </svg>
  );
}
