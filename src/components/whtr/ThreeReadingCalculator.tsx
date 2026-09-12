import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateWhtr, validateMeasurement, Unit } from "@/lib/whtr";

export function averageThreeReadings(values: number[], metric: boolean): number | null {
  if (values.length !== 3 || values.some(v => !Number.isFinite(v) || v <= 0)) return null;
  const inches = values.map(v => metric ? v / 2.54 : v);
  return inches.reduce((sum, v) => sum + Math.floor(v * 2 + 1e-9) / 2, 0) / 3;
}

export default function ThreeReadingCalculator() {
  const [unit, setUnit] = useState<Unit>("imperial");
  const [height, setHeight] = useState("");
  const [readings, setReadings] = useState(["", "", ""]);
  const [result, setResult] = useState<ReturnType<typeof calculateWhtr>>(null);
  const [error, setError] = useState("");
  const metric = unit === "metric";
  const label = metric ? "centimeters" : "inches";
  const validReadings = readings.every(v => !validateMeasurement(v, "waist", unit, "Waist"));
  const average = validReadings ? averageThreeReadings(readings.map(Number), metric) : null;
  const clear = () => { setHeight(""); setReadings(["", "", ""]); setResult(null); setError(""); };
  return <section className="glass rounded-2xl p-6 md:p-8 space-y-6" aria-labelledby="three-reading-heading">
    <div><h2 id="three-reading-heading" className="text-2xl font-heading font-bold">Army WHtR Calculator</h2>
      <p className="text-muted-foreground">Waist-to-height ratio · Not an official assessment</p></div>
    <details><summary className="cursor-pointer font-medium">Other services and standards</summary>
      <p className="mt-3 text-muted-foreground">This calculator uses the Army benchmark. Other services may use different standards. <a className="underline" href="https://www.armyresilience.army.mil/Army-Body-Composition-Program/">Review current Army guidance.</a></p></details>
    <form className="space-y-5" onSubmit={e => {
      e.preventDefault();
      const message = validateMeasurement(height, "height", unit, "Height") || readings.map((v, i) => validateMeasurement(v, "waist", unit, `Waist reading ${i + 1}`)).find(Boolean);
      if (message || average === null) { setError(message || "Enter all three waist readings."); setResult(null); return; }
      setError("");
      const heightInches = metric ? Number(height) / 2.54 : Number(height);
      setResult(calculateWhtr(Math.round(heightInches * 2) / 2, average));
    }}>
      <h3 className="text-xl font-semibold">Measurements</h3>
      <div className="space-y-2"><label htmlFor="three-unit">Measurement unit</label>
        <select id="three-unit" value={unit} className="block w-full rounded-md border border-input bg-background p-3" onChange={e => { setUnit(e.target.value as Unit); clear(); }}>
          <option value="imperial">Inches</option><option value="metric">Centimeters</option>
        </select><p className="text-sm text-muted-foreground">Changing units clears measurements to avoid mixing units.</p></div>
      <div className="space-y-2"><label htmlFor="three-height">Height ({label})</label>
        <Input id="three-height" inputMode="decimal" value={height} onChange={e => { setHeight(e.target.value); setResult(null); setError(""); }} aria-describedby="three-height-help" />
        <p id="three-height-help" className="text-sm text-muted-foreground">{metric ? "Height is converted to inches, then rounded to the nearest 0.50 inch." : "Enter height to the nearest 0.50 inch."}</p></div>
      <fieldset className="space-y-3"><legend className="font-medium">Waist measurements ({label})</legend>
        <div className="grid sm:grid-cols-3 gap-4">{["First", "Second", "Third"].map((name, i) => <div key={name} className="space-y-2">
          <label htmlFor={`three-waist-${i}`}>{name}</label><Input id={`three-waist-${i}`} inputMode="decimal" value={readings[i]} onChange={e => { setReadings(readings.map((v, j) => i === j ? e.target.value : v)); setResult(null); setError(""); }} />
        </div>)}</div>
        <p className="text-sm text-muted-foreground">Take three readings at your belly button. The calculator {metric ? "converts each to inches and " : ""}rounds each down to ½ inch, then averages them.</p>
      </fieldset>
      <p aria-live="polite">Average waist: <strong>{average === null ? "--" : `${(average * (metric ? 2.54 : 1)).toFixed(2)} ${label}`}</strong></p>
      <details><summary className="cursor-pointer font-medium">Measurement details</summary><p className="mt-3 text-sm text-muted-foreground">This three-reading estimate divides the average of the rounded waist measurements by height rounded to the nearest half inch. The ratio is truncated to three decimals. The displayed average is rounded for readability; calculation uses the full average. Follow current Army instructions for an official assessment.</p></details>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-3"><Button type="submit">Calculate WHtR</Button><Button type="button" variant="outline" onClick={clear}>Clear</Button></div>
      {result && <div role="status" className="rounded-lg border border-border p-4"><p className="text-2xl font-bold">WHtR: {result.display}</p><p>{result.withinStandard ? "Below the Army benchmark of 0.550." : "At or above the Army benchmark of 0.550."}</p><p className="text-sm text-muted-foreground">Personal estimate — not an official assessment.</p></div>}
    </form>
  </section>;
}
