import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { buildThresholdTable } from "@/lib/whtr";

const DEFAULT_RANGE: [number, number] = [64, 76];
const FULL_RANGE: [number, number] = [54, 84];

const WaistLimitsTable = () => {
  const [range, setRange] = useState<[number, number]>(DEFAULT_RANGE);
  const rows = useMemo(() => buildThresholdTable(range[0], range[1]), [range]);
  const expanded = range[0] === FULL_RANGE[0] && range[1] === FULL_RANGE[1];

  return (
    <section id="waist-limits" className="scroll-mt-28">
      <h2 className="font-heading text-2xl sm:text-3xl">Army Waist Limits by Height</h2>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        The 0.550 boundary is the mathematical maximum waist for a given height (height × 0.55). A recorded WHtR
        must remain below 0.550, so a measurement landing exactly on the boundary does not meet the standard.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant={expanded ? "secondary" : "default"}
          size="sm"
          onClick={() => setRange(DEFAULT_RANGE)}
        >
          64–76 in
        </Button>
        <Button variant={expanded ? "default" : "secondary"} size="sm" onClick={() => setRange(FULL_RANGE)}>
          Expand 54–84 in
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Army WHtR waist thresholds by height, from {range[0]} to {range[1]} inches
          </caption>
          <thead className="bg-secondary/70 font-heading uppercase tracking-wide">
            <tr>
              <th scope="col" className="px-4 py-3">Height</th>
              <th scope="col" className="px-4 py-3">0.550 Boundary</th>
              <th scope="col" className="px-4 py-3">Highest 0.5-in Increment Below Boundary</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.heightInches} className="border-t border-border/60">
                <th scope="row" className="px-4 py-2 font-normal">
                  {row.heightInches} in / {row.heightFeetInches}
                </th>
                <td className="px-4 py-2">{row.thresholdWaist.toFixed(2)} in</td>
                <td className="px-4 py-2 text-primary">{row.highestHalfIncrement.toFixed(1)} in</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default WaistLimitsTable;
