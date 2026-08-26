import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const points = [
  "WHtR is now the Army's sole authorized body-composition assessment.",
  "The previous height-and-weight screening tables are discontinued.",
  "Previous supplemental body-fat methods cannot be used to challenge the WHtR result.",
  "The Army standard is less than, but not equal to, 0.55.",
  "All Soldiers are assessed at least twice per calendar year.",
  "A commander may direct an additional assessment.",
  "A Soldier who does not meet the initial WHtR standard receives a confirmation measurement on the same duty day by a different measurement team.",
  "A confirmed WHtR of 0.55 or greater results in ABCP enrollment and a flag under current policy.",
  "A high Army Fitness Test score does not exempt a Soldier from the WHtR standard.",
  "WHtR is recorded on DA Form 5500 and in ATIS.",
  "DA Form 5501 is no longer used under the new policy.",
  "The Army generally requires at least seven days between the AFT/CFT and the WHtR assessment unless operational requirements dictate otherwise.",
];

const PolicySection = () => (
  <section id="policy" className="scroll-mt-28">
    <h2 className="font-heading text-2xl sm:text-3xl">Army Policy Information</h2>
    <Accordion type="single" collapsible defaultValue="ad" className="mt-4 rounded-xl border border-border px-4">
      <AccordionItem value="ad" className="border-none">
        <AccordionTrigger className="font-heading uppercase tracking-wide">
          Understanding Army Directive 2026-13
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2">
            {points.map((point) => (
              <li key={point} className="flex gap-3 text-muted-foreground">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            This website is not an official Army system. Current Army policy and your command's guidance control.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
);

export default PolicySection;
