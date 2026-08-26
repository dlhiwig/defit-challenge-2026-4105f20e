import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const faqs = [
  {
    q: "What is the Army WHtR standard?",
    a: "The Army standard is a waist-to-height ratio of less than 0.550, calculated as waist circumference measured at the navel divided by height in the same unit.",
  },
  {
    q: "Does 0.550 pass?",
    a: "No. The standard is strictly less than 0.550, so a recorded WHtR of 0.550 does not meet the standard.",
  },
  {
    q: "Does 0.549 pass?",
    a: "Yes, based on the Army's recorded three-decimal WHtR standard. Digits after the third decimal place are disregarded rather than rounded up.",
  },
  {
    q: "Where is the waist measured?",
    a: "At the navel or belly-button level, with the tape held horizontal and level around the body.",
  },
  {
    q: "Does age change the Army WHtR limit?",
    a: "No. This calculator uses no age-based table; the WHtR standard is the same regardless of age.",
  },
  {
    q: "Does sex change the Army WHtR limit?",
    a: "No. This calculator uses no sex-based standard; the WHtR standard is the same for all Soldiers.",
  },
  {
    q: "Does a high AFT score exempt a Soldier?",
    a: "No. Army Fitness Test performance does not exempt a Soldier from the WHtR body-composition standard.",
  },
  {
    q: "Do Soldiers still use the old Army height and weight tables?",
    a: "No. Army Directive 2026-13 discontinued the legacy height-and-weight screening tables.",
  },
  {
    q: "Can I use another tape-test method if I fail?",
    a: "No. Previous supplemental body-fat methods cannot be used to override the WHtR result. Current Army guidance makes WHtR the authorized ABCP standard.",
  },
  {
    q: "What happens if my initial assessment is 0.550 or higher?",
    a: "Army policy requires a confirmation measurement on the same duty day by a different measurement team before commander action. A confirmed WHtR of 0.55 or greater results in ABCP enrollment and a flag under current policy.",
  },
  {
    q: "Is this an official Army calculator?",
    a: "No. It is an independent informational and planning tool. Your official unit assessment, DA Form 5500 and ATIS record are the measurement of record.",
  },
];

const WhtrFaq = () => (
  <section id="faq" className="scroll-mt-28">
    <h2 className="font-heading text-2xl sm:text-3xl">FAQ</h2>
    <Accordion type="single" collapsible className="mt-4 rounded-xl border border-border px-4">
      {faqs.map((item, i) => (
        <AccordionItem key={item.q} value={`faq-${i}`} className="border-border/60 last:border-none">
          <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </section>
);

export default WhtrFaq;
