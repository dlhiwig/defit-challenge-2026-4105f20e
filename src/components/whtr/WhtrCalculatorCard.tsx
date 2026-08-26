import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Copy, HelpCircle, Printer, RotateCcw, Share2 } from "lucide-react";
import {
  ARMY_WHTR_LIMIT,
  cmToInches,
  formatFeetInches,
  highestHalfIncrementBelow,
  LIMITS,
  Unit,
  calculateWhtr,
  validateMeasurement,
} from "@/lib/whtr";
import WhtrGauge from "./WhtrGauge";

const num = (raw: string) => {
  const v = Number(raw.trim());
  return raw.trim() === "" || !Number.isFinite(v) ? NaN : v;
};

const WhtrCalculatorCard = () => {
  const [unit, setUnit] = useState<Unit>("imperial");
  const [feet, setFeet] = useState("6");
  const [inches, setInches] = useState("0");
  const [cm, setCm] = useState("182.9");
  const [waist, setWaist] = useState("39.5");
  const [touched, setTouched] = useState(false);

  const suffix = unit === "imperial" ? "in" : "cm";

  // Height in the active unit.
  const heightValue = useMemo(() => {
    if (unit === "metric") return num(cm);
    const f = num(feet);
    const i = inches.trim() === "" ? 0 : num(inches);
    if (!Number.isFinite(f) || !Number.isFinite(i)) return NaN;
    return f * 12 + i;
  }, [unit, cm, feet, inches]);

  const waistValue = num(waist);

  const heightError = useMemo(() => {
    if (unit === "metric") return validateMeasurement(cm, "height", "metric", "Height");
    if (feet.trim() === "" && inches.trim() === "") return "Enter a height.";
    if (!/^\d*\.?\d*$/.test(feet.trim()) || !/^\d*\.?\d*$/.test(inches.trim())) {
      return "Height must be a number.";
    }
    if (!Number.isFinite(heightValue)) return "Height must be a number.";
    const { min, max } = LIMITS.imperial.height;
    if (heightValue < min || heightValue > max) return `Height must be between ${min} and ${max} in.`;
    return null;
  }, [unit, cm, feet, inches, heightValue]);

  const waistError = useMemo(
    () => validateMeasurement(waist, "waist", unit, "Waist circumference"),
    [waist, unit],
  );

  const result = useMemo(() => {
    if (heightError || waistError) return null;
    return calculateWhtr(heightValue, waistValue);
  }, [heightError, waistError, heightValue, waistValue]);

  // Keep the two unit systems in sync so switching never loses the measurement.
  useEffect(() => {
    if (unit === "metric" && Number.isFinite(heightValue)) return;
  }, [unit, heightValue]);

  const switchUnit = (next: Unit) => {
    if (next === unit) return;
    if (next === "metric") {
      if (Number.isFinite(heightValue)) setCm((heightValue * 2.54).toFixed(1));
      if (Number.isFinite(waistValue)) setWaist((waistValue * 2.54).toFixed(1));
    } else {
      if (Number.isFinite(heightValue)) {
        const totalIn = cmToInches(heightValue);
        setFeet(String(Math.floor(totalIn / 12)));
        setInches((totalIn - Math.floor(totalIn / 12) * 12).toFixed(1));
      }
      if (Number.isFinite(waistValue)) setWaist(cmToInches(waistValue).toFixed(1));
    }
    setUnit(next);
  };

  const reset = () => {
    setUnit("imperial");
    setFeet("");
    setInches("");
    setCm("");
    setWaist("");
    setTouched(false);
  };

  const decimals = unit === "imperial" ? 1 : 1;
  const heightLabel =
    unit === "imperial" && Number.isFinite(heightValue)
      ? `${heightValue.toFixed(1)} in (${formatFeetInches(heightValue)})`
      : Number.isFinite(heightValue)
        ? `${heightValue.toFixed(1)} cm`
        : "—";

  const shareText = result
    ? [
        "Army WHtR Calculator",
        "",
        `Height: ${heightValue.toFixed(1)} ${suffix}`,
        `Waist: ${waistValue.toFixed(1)} ${suffix}`,
        `WHtR: ${result.display}`,
        "Standard: < 0.550",
        `Status: ${result.withinStandard ? "WITHIN STANDARD" : "DOES NOT MEET STANDARD"}`,
      ].join("\n")
    : "";

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Result copied", description: "No personal information is included." });
    } catch {
      toast({ title: "Copy failed", description: "Your browser blocked clipboard access.", variant: "destructive" });
    }
  };

  const shareResult = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Army WHtR Calculator", text: shareText });
        return;
      } catch {
        /* user dismissed the share sheet */
      }
    }
    copyResult();
  };

  const showErrors = touched;

  return (
    <div className="space-y-6">
      {/* Input card */}
      <div className="glass rounded-xl p-5 sm:p-8">
        <Tabs value={unit} onValueChange={(v) => switchUnit(v as Unit)}>
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="imperial">Imperial</TabsTrigger>
            <TabsTrigger value="metric">Metric</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {/* Height */}
          <div className="space-y-2">
            <Label className="font-heading uppercase tracking-wide">Height</Label>
            {unit === "imperial" ? (
              <div className="flex items-center gap-2">
                <Input
                  inputMode="decimal"
                  aria-label="Height, feet"
                  value={feet}
                  onChange={(e) => {
                    setFeet(e.target.value);
                    setTouched(true);
                  }}
                  placeholder="6"
                  aria-invalid={Boolean(showErrors && heightError)}
                />
                <span className="text-muted-foreground text-sm">ft</span>
                <Input
                  inputMode="decimal"
                  step="0.5"
                  aria-label="Height, inches"
                  value={inches}
                  onChange={(e) => {
                    setInches(e.target.value);
                    setTouched(true);
                  }}
                  placeholder="0"
                  aria-invalid={Boolean(showErrors && heightError)}
                />
                <span className="text-muted-foreground text-sm">in</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  inputMode="decimal"
                  aria-label="Height in centimeters"
                  value={cm}
                  onChange={(e) => {
                    setCm(e.target.value);
                    setTouched(true);
                  }}
                  placeholder="182.9"
                  aria-invalid={Boolean(showErrors && heightError)}
                />
                <span className="text-muted-foreground text-sm">cm</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {Number.isFinite(heightValue) && !heightError ? heightLabel : "\u00a0"}
            </p>
            {showErrors && heightError && (
              <p className="text-sm text-destructive" role="alert">
                {heightError}
              </p>
            )}
          </div>

          {/* Waist */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="whtr-waist" className="font-heading uppercase tracking-wide">
                Waist Circumference at the Navel
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="How to measure your waist"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Measure around the abdomen at the level of the belly button. Keep the tape level around the body.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="whtr-waist"
                inputMode="decimal"
                step={unit === "imperial" ? "0.5" : "0.1"}
                value={waist}
                onChange={(e) => {
                  setWaist(e.target.value);
                  setTouched(true);
                }}
                placeholder={unit === "imperial" ? "39.5" : "100.3"}
                aria-invalid={Boolean(showErrors && waistError)}
              />
              <span className="text-muted-foreground text-sm">{suffix}</span>
            </div>
            <p className="text-sm text-muted-foreground">Measured at the navel, tape level.</p>
            {showErrors && waistError && (
              <p className="text-sm text-destructive" role="alert">
                {waistError}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            size="lg"
            className="font-heading"
            onClick={() => {
              setTouched(true);
              if (!result) {
                toast({ title: "Check your measurements", description: "Enter a valid height and waist." });
              }
            }}
          >
            Calculate My WHtR
          </Button>
          <Button size="lg" variant="secondary" className="font-heading" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Results update live. Nothing you type is sent to a server or stored as a personnel record.
        </p>
      </div>

      {/* Result card */}
      <div
        id="whtr-result"
        className={`rounded-xl border-2 p-5 sm:p-8 ${
          result
            ? result.withinStandard
              ? "border-primary bg-card"
              : "border-destructive bg-card"
            : "border-border bg-card"
        }`}
        aria-live="polite"
      >
        {!result ? (
          <p className="text-muted-foreground">
            Enter a height and a waist circumference to see your Army WHtR.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div
                  className={`flex items-center gap-2 font-heading text-lg uppercase tracking-widest ${
                    result.withinStandard ? "text-primary" : "text-destructive"
                  }`}
                >
                  {result.withinStandard ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  {result.withinStandard ? "Within Army Standard" : "Does Not Meet Army Standard"}
                </div>
                <div className="mt-2 font-heading text-6xl font-bold leading-none tracking-tight sm:text-7xl">
                  {result.display}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  WHtR · Army standard: &lt; 0.550 (recorded to three decimals, truncated)
                </p>
              </div>
              <div className="flex flex-wrap gap-2 print:hidden">
                <Button variant="secondary" size="sm" onClick={copyResult}>
                  <Copy className="mr-2 h-4 w-4" /> Copy Result
                </Button>
                <Button variant="secondary" size="sm" onClick={shareResult}>
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
                <Button variant="secondary" size="sm" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Height", value: `${heightValue.toFixed(decimals)} ${suffix}` },
                { label: "Waist", value: `${waistValue.toFixed(decimals)} ${suffix}` },
                { label: "Army Threshold", value: `${result.thresholdWaist.toFixed(2)} ${suffix}` },
                {
                  label: result.margin >= 0 ? "Margin" : "Difference",
                  value: `${Math.abs(result.margin).toFixed(2)} ${suffix} ${
                    result.margin >= 0 ? "below threshold" : "above threshold"
                  }`,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-secondary/60 p-3">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</dt>
                  <dd className="mt-1 font-heading text-lg">{item.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6">
              <WhtrGauge ratio={result.ratio} />
            </div>

            {/* Maximum waist */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <h3 className="font-heading text-base uppercase tracking-wide">Maximum Waist for My Height</h3>
                <p className="mt-2 font-heading text-2xl text-primary">
                  {result.thresholdWaist.toFixed(2)} {suffix}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Army WHtR boundary. To meet the standard, the Soldier's recorded WHtR must remain below 0.550.
                </p>
                {unit === "imperial" && (
                  <p className="mt-2 text-sm">
                    Highest half-inch measurement below the threshold:{" "}
                    <span className="font-heading">
                      {highestHalfIncrementBelow(result.thresholdWaist).toFixed(1)} in
                    </span>
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  The mathematical boundary and a practical half-inch measurement increment are different concepts.
                </p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <h3 className="font-heading text-base uppercase tracking-wide">
                  What Would Put Me Within Standard?
                </h3>
                {result.withinStandard ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your recorded WHtR of {result.display} is below the Army limit. You have{" "}
                    <span className="font-heading text-foreground">
                      {Math.abs(result.margin).toFixed(2)} {suffix}
                    </span>{" "}
                    of margin before reaching the {result.thresholdWaist.toFixed(2)} {suffix} boundary.
                  </p>
                ) : (
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      Army mathematical threshold:{" "}
                      <span className="font-heading">
                        {result.thresholdWaist.toFixed(2)} {suffix}
                      </span>
                    </p>
                    <p>
                      Difference from threshold:{" "}
                      <span className="font-heading text-destructive">
                        {Math.abs(result.margin).toFixed(2)} {suffix}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      A recorded waist below that boundary would place the WHtR under 0.550. This tool does not
                      provide medical or weight-loss guidance.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {!result.withinStandard && (
              <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
                <p className="font-heading uppercase tracking-wide">If an assessment records 0.550 or greater</p>
                <p className="mt-2 text-muted-foreground">
                  Army policy provides for a confirmation measurement on the same duty day by a different
                  measurement team. A confirmed WHtR of 0.55 or greater results in ABCP enrollment and a flag under
                  current policy. Your unit's official measurement is the measurement of record.
                </p>
              </div>
            )}

            <p className="mt-6 text-xs text-muted-foreground">
              Unofficial Army WHtR planning tool. This website is not affiliated with or endorsed by the Department
              of Defense or Department of the Army. Results are provided for informational purposes only. Your
              official Army measurement, DA Form 5500, ATIS record, command guidance, and current Army policy
              control.
            </p>

            {/* Print-only summary */}
            <div className="hidden print:mt-6 print:block">
              <h2 className="font-heading text-xl uppercase">Army Waist-to-Height Ratio Calculator</h2>
              <table className="mt-3 w-full text-left text-sm">
                <tbody>
                  <tr>
                    <th className="py-1 pr-4">Height</th>
                    <td>
                      {heightValue.toFixed(1)} {suffix}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-1 pr-4">Waist (at navel)</th>
                    <td>
                      {waistValue.toFixed(1)} {suffix}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-1 pr-4">Calculated WHtR</th>
                    <td>{result.display}</td>
                  </tr>
                  <tr>
                    <th className="py-1 pr-4">Army Standard</th>
                    <td>&lt; {ARMY_WHTR_LIMIT.toFixed(3)}</td>
                  </tr>
                  <tr>
                    <th className="py-1 pr-4">Result</th>
                    <td>{result.withinStandard ? "WITHIN STANDARD" : "DOES NOT MEET STANDARD"}</td>
                  </tr>
                  <tr>
                    <th className="py-1 pr-4">Date Calculated</th>
                    <td>{new Date().toLocaleDateString()}</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-3 text-xs">
                Source: Army Directive 2026-13, Army Body Composition Program and Standards (Department of the
                Army); Army Body Composition Program, Directorate of Prevention, Resilience and Readiness. This is
                not an official Army form or system.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WhtrCalculatorCard;
