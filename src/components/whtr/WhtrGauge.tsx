import { ARMY_WHTR_LIMIT } from "@/lib/whtr";

const MIN = 0.4;
const MAX = 0.7;

const pct = (value: number) => ((Math.min(Math.max(value, MIN), MAX) - MIN) / (MAX - MIN)) * 100;

interface Props {
  ratio: number;
}

/** Compliance gauge showing where a recorded WHtR sits relative to the 0.550 Army limit. */
const WhtrGauge = ({ ratio }: Props) => {
  const limitPct = pct(ARMY_WHTR_LIMIT);
  const valuePct = pct(ratio);
  const within = ratio < ARMY_WHTR_LIMIT;

  return (
    <figure
      role="img"
      aria-label={`Compliance gauge. Recorded WHtR ${ratio.toFixed(3)} against the Army limit of 0.550.`}
    >
      <figcaption className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>Margin to standard</span>
        <span className="text-primary">Army limit: 0.550</span>
      </figcaption>

      <div className="relative h-8">
        <div className="absolute inset-x-0 top-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-primary/30" style={{ width: `${limitPct}%` }} />
        </div>

        {/* Army limit marker */}
        <div className="absolute top-0 h-8 w-0.5 bg-primary" style={{ left: `${limitPct}%` }} />

        {/* User's result marker */}
        <div
          className={`absolute top-1 h-6 w-1.5 rounded-full ${within ? "bg-primary" : "bg-destructive"}`}
          style={{ left: `calc(${valuePct}% - 3px)` }}
        />
      </div>

      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>0.40</span>
        <span>0.45</span>
        <span>0.50</span>
        <span className="text-primary">0.550</span>
        <span>0.60</span>
        <span>0.70</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        This gauge visualizes Army compliance only. It does not represent a medical or health assessment.
      </p>
    </figure>
  );
};

export default WhtrGauge;
