import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { averageMeasurements, calculateWhtr, formatFeetInches } from "@/lib/whtr";

const toNumber = (raw: string) => {
  const v = Number(raw.trim());
  return raw.trim() === "" || !Number.isFinite(v) ? NaN : v;
};

/** Optional tool: average up to three waist measurements and score the average. */
const CompareMeasurements = () => {
  const [height, setHeight] = useState("");
  const [values, setValues] = useState(["", "", ""]);

  const heightIn = toNumber(height);
  const nums = values.map(toNumber);
  const average = useMemo(() => averageMeasurements(nums), [values]); // eslint-disable-line react-hooks/exhaustive-deps
  const result = average !== null && heightIn > 0 ? calculateWhtr(heightIn, average) : null;

  return (
    <section id="compare" className="scroll-mt-28">
      <h2 className="font-heading text-2xl sm:text-3xl">Compare Measurements</h2>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        Optional. If you took the tape more than once, average the readings here. These fields are not required for
        the basic calculator.
      </p>

      <div className="mt-4 grid gap-6 rounded-xl border border-border p-5 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cmp-height">Height (inches)</Label>
            <Input
              id="cmp-height"
              inputMode="decimal"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="72"
            />
            {heightIn > 0 && (
              <p className="text-sm text-muted-foreground">{formatFeetInches(heightIn)}</p>
            )}
          </div>
          {values.map((value, i) => (
            <div key={i} className="space-y-2">
              <Label htmlFor={`cmp-${i}`}>Measurement {i + 1} (inches)</Label>
              <Input
                id={`cmp-${i}`}
                inputMode="decimal"
                value={value}
                onChange={(e) =>
                  setValues((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                }
                placeholder={["39.5", "39.5", "40.0"][i]}
              />
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-secondary/50 p-4" aria-live="polite">
          <h3 className="font-heading uppercase tracking-wide">Averaged result</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {nums.map((n, i) => (
              <li key={i} className="flex justify-between">
                <span className="text-muted-foreground">Measurement {i + 1}</span>
                <span>{Number.isFinite(n) && n > 0 ? `${n.toFixed(1)} in` : "—"}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average waist</span>
              <span className="font-heading">{average !== null ? `${average.toFixed(2)} in` : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">WHtR from average</span>
              <span className="font-heading text-xl">{result ? result.display : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Army status</span>
              <span className={`font-heading ${result ? (result.withinStandard ? "text-primary" : "text-destructive") : ""}`}>
                {result ? (result.withinStandard ? "WITHIN STANDARD" : "DOES NOT MEET STANDARD") : "—"}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Averaging is a planning aid only. Your unit's official measurement is the measurement of record.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CompareMeasurements;
