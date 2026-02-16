import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const generalFAQs = [
  {
    q: "What is DEFIT?",
    a: "DEFIT (Double Eagle Fitness Challenge) is a fitness engagement platform designed to promote readiness, wellness, and friendly competition across teams and organizations. Participants track physical activity, earn points, and contribute to team standings during a structured challenge period.",
  },
  {
    q: "Who can participate?",
    a: "Participation is open to authorized members within the designated organization or unit. Specific eligibility guidance will be provided through your local leadership or program coordinator.",
  },
  {
    q: "Is this an official fitness assessment?",
    a: "No. DEFIT is not a replacement for official fitness testing requirements. It is a voluntary wellness and engagement initiative intended to encourage physical activity and team cohesion.",
  },
  {
    q: "Is participation mandatory?",
    a: "Participation is voluntary unless otherwise directed by your leadership. The goal is to promote engagement and wellness — not compliance enforcement.",
  },
  {
    q: "How long does the challenge run?",
    a: "Challenge duration is defined at launch and may range from several weeks to a quarter, depending on organizational goals.",
  },
  {
    q: "Will there be prizes or recognition?",
    a: "Recognition may include leaderboard standings, team awards, certificates, or organizational acknowledgment. Specific incentives will be announced by program leadership.",
  },
];

const scoringFAQs = [
  {
    q: "How does the scoring system work?",
    a: "Participants log approved physical activities within the app. Activities convert to points based on predefined scoring criteria. Points contribute to individual progress and may also roll up into team totals, depending on challenge configuration. Scoring criteria are standardized to ensure fairness and consistency across participants.",
  },
  {
    q: "What activities count toward points?",
    a: "Eligible activities may include: running, walking, cycling, strength training, swimming, rucking, organized sports, and other approved cardiovascular or strength-based activities. Specific scoring rules are defined within the platform for transparency.",
  },
  {
    q: "How do I log my activity?",
    a: "Users log activities directly within the DEFIT app or website. In future releases, integration with fitness trackers or wearables may be supported.",
  },
  {
    q: "Can I edit or correct a submission?",
    a: "Yes. Users can update or correct activity entries within a defined time window. Administrative oversight ensures fairness and integrity.",
  },
  {
    q: "What happens if I miss a few days?",
    a: "Nothing dramatic. This is a cumulative challenge. Log activity when you can and stay engaged. Consistency helps, but perfection is not required.",
  },
];

const privacyFAQs = [
  {
    q: "Is my personal data secure?",
    a: "Yes. DEFIT is designed with data protection principles in mind. Only necessary participation data is collected. Information is stored securely and is not used for unrelated purposes.",
  },
  {
    q: "Who can see my activity?",
    a: "Visibility depends on configuration settings. In most cases: you can see your own activity, leaderboards may display names and point totals, and administrators can view participation data for oversight. Health-specific details are not publicly displayed.",
  },
];

const testPhaseFAQs = [
  {
    q: 'What does "test phase" mean?',
    a: "The platform is currently being evaluated for usability, stability, scoring logic, and reporting accuracy. Users are encouraged to explore features and provide structured feedback.",
  },
  {
    q: "Will my test data carry over?",
    a: "Depending on configuration, test data may not transfer to future production environments.",
  },
  {
    q: "Is the platform currently in production?",
    a: "DEFIT may be in pilot or test phase depending on deployment status. Features and scoring rules may be refined during evaluation.",
  },
  {
    q: "Why is feedback important?",
    a: "Early feedback allows rapid improvement, reduces deployment risk, and ensures the final product aligns with operational needs.",
  },
  {
    q: "What if I experience a technical issue?",
    a: "Report issues through the designated support channel or program POC. During the test phase, feedback is encouraged to improve performance and user experience.",
  },
];

interface FAQGroupProps {
  title: string;
  items: { q: string; a: string }[];
  idPrefix: string;
}

const FAQGroup = ({ title, items, idPrefix }: FAQGroupProps) => (
  <div className="mb-12">
    <h2 className="text-2xl md:text-3xl font-bold mb-6">
      <span className="text-gradient">{title}</span>
    </h2>
    <Accordion type="single" collapsible className="space-y-3">
      {items.map((item, i) => (
        <AccordionItem
          key={`${idPrefix}-${i}`}
          value={`${idPrefix}-${i}`}
          className="glass rounded-xl border-none px-6"
        >
          <AccordionTrigger className="text-left text-foreground hover:no-underline">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);

const FAQ = () => {
  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />

      <section className="pt-32 pb-16">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about the DEFIT Challenge.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <FAQGroup title="General" items={generalFAQs} idPrefix="gen" />
            <FAQGroup title="Scoring & Activities" items={scoringFAQs} idPrefix="score" />
            <FAQGroup title="Privacy & Data" items={privacyFAQs} idPrefix="priv" />
            <FAQGroup title="Test Phase" items={testPhaseFAQs} idPrefix="test" />
          </div>
        </div>
      </section>

      <BackToTop />
      <Footer />
    </main>
  );
};

export default FAQ;
