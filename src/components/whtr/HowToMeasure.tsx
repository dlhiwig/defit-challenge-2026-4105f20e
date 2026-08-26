const steps = [
  "Stand naturally and upright.",
  "Locate the navel or belly button.",
  "Place the measuring tape around the abdomen at that level.",
  "Keep the tape horizontal and level around the body.",
  "Make sure the tape is snug without unnecessarily compressing the body.",
  "Record the measurement carefully.",
  "Use the measurement according to current Army measurement guidance.",
];

const HowToMeasure = () => (
  <section id="how-to-measure" className="scroll-mt-28">
    <h2 className="font-heading text-2xl sm:text-3xl">How to Measure Your Waist</h2>
    <div className="mt-4 grid gap-6 md:grid-cols-[280px_1fr] md:items-start">
      <figure className="rounded-xl border border-border bg-card p-4">
        <svg viewBox="0 0 200 260" className="mx-auto h-64 w-auto" role="img" aria-label="Silhouette of a person with a level measuring line drawn horizontally at the navel">
          <g fill="hsl(var(--muted-foreground))" opacity="0.55">
            <circle cx="100" cy="34" r="20" />
            <path d="M100 58c-22 0-38 12-42 32l-8 44h18l4 92h56l4-92h18l-8-44c-4-20-20-32-42-32z" />
          </g>
          <line
            x1="26"
            y1="140"
            x2="174"
            y2="140"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeDasharray="8 5"
          />
          <circle cx="100" cy="140" r="4" fill="hsl(var(--primary))" />
          <text x="100" y="128" textAnchor="middle" fontSize="12" fill="hsl(var(--primary))">
            NAVEL — TAPE LEVEL
          </text>
        </svg>
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">
          Tape level with the floor, at navel height.
        </figcaption>
      </figure>

      <div>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-sm text-primary-foreground">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
          Your unit's official measurement is the measurement of record.
        </p>
      </div>
    </div>
  </section>
);

export default HowToMeasure;
