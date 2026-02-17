import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import { Link } from "react-router-dom";
import {
  Mail,
  Shield,
  Monitor,
  ClipboardList,
  Megaphone,
  FlaskConical,
  Inbox,
  Clock,
  Info,
  ExternalLink,
} from "lucide-react";

const pocs = [
  {
    icon: Shield,
    section: "Program Leadership",
    role: "Program Lead",
    responsibility:
      "Executive-level coordination, strategic alignment, policy questions, and interagency or senior leader engagement.",
    name: "[Full Name]",
    title: "DEFIT Program Lead",
    email: "program.lead@defit.mil",
    response: "Within 1 business day",
  },
  {
    icon: Monitor,
    section: "Technical Support & Platform Operations",
    role: "Technical Lead",
    responsibility:
      "Platform functionality, authentication issues, account access problems, system errors, and integration inquiries.",
    name: "[Full Name]",
    title: "DEFIT Technical Lead",
    email: "tech.lead@defit.mil",
    response: "Within 1 business day",
    extra: {
      label: "When reporting technical issues, please include:",
      items: [
        "Device type (desktop/mobile)",
        "Browser and version",
        "Screenshot (if available)",
        "Date and time of issue",
        "Steps taken before the issue occurred",
        "Exact error message (if displayed)",
      ],
      note: "Providing this information will significantly reduce resolution time.",
      cta: { label: "Submit a Technical Report", href: "/report-issue" },
    },
  },
  {
    icon: ClipboardList,
    section: "Challenge Administration & Operations",
    role: "Challenge Administrator",
    responsibility:
      "Registration questions, team enrollment, eligibility, scoring clarifications, leaderboard discrepancies, and challenge rules.",
    name: "[Full Name]",
    title: "DEFIT Operations Lead",
    email: "operations@defit.mil",
    response: "Within 1 business day",
  },
  {
    icon: Megaphone,
    section: "Communications & Outreach",
    role: "Communications POC",
    responsibility:
      "Messaging, promotional materials, briefings, graphics, coordination with leadership offices, and distribution support.",
    name: "[Full Name]",
    title: "DEFIT Communications Lead",
    email: "comms@defit.mil",
    response: "Within 1–2 business days",
  },
];

const ContactPOC = () => {
  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "DEFIT – Contact & Points of Contact",
      description:
        "Official Points of Contact for the Double Eagle Fitness Challenge platform and program.",
      mainEntity: {
        "@type": "Organization",
        name: "Double Eagle Fitness Challenge (DEFIT)",
        contactPoint: pocs.map((poc) => ({
          "@type": "ContactPoint",
          contactType: poc.role,
          email: poc.email,
          description: poc.responsibility,
        })),
      },
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-8">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Contact & <span className="text-gradient">POC</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Official Points of Contact for the DEFIT platform and program.
              Use the role-based guidance below to ensure your inquiry is routed
              appropriately. All communications are handled within our private
              networking infrastructure with SOC 2 and HIPAA compliance.
            </p>
          </div>
        </div>
      </section>

      {/* Routing Guidance */}
      <section className="pb-8">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass rounded-xl p-5 flex items-start gap-4 border-primary/20">
              <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  For technical issues and system errors, use the{" "}
                  <Link
                    to="/report-issue"
                    className="text-primary hover:underline font-medium"
                  >
                    Report Issue
                  </Link>{" "}
                  page for faster triage. For general questions, check the{" "}
                  <Link
                    to="/faq"
                    className="text-primary hover:underline font-medium"
                  >
                    FAQ
                  </Link>{" "}
                  first.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POC Cards */}
      <section className="pb-8">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {pocs.map((poc) => (
              <div key={poc.section} className="glass rounded-2xl p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <poc.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {poc.section}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {poc.responsibility}
                    </p>
                  </div>
                </div>

                <div className="ml-14 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Role:</span>{" "}
                      <span className="text-foreground font-medium">
                        {poc.role}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Name:</span>{" "}
                      <span className="text-foreground font-medium">
                        {poc.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Title:</span>{" "}
                      <span className="text-foreground font-medium">
                        {poc.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <a
                        href={`mailto:${poc.email}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {poc.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Response Time: {poc.response}</span>
                  </div>

                  {poc.extra && (
                    <div className="mt-4 rounded-xl bg-card/50 border border-border p-4">
                      <p className="text-sm font-medium text-foreground mb-2">
                        {poc.extra.label}
                      </p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-3">
                        {poc.extra.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-muted-foreground italic mb-3">
                        {poc.extra.note}
                      </p>
                      <Link
                        to={poc.extra.cta.href}
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {poc.extra.cta.label}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beta Feedback */}
      <section className="pb-8">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto glass rounded-2xl p-6 md:p-8 border-primary/20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <FlaskConical className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  DEFIT Test Phase Feedback{" "}
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-wide ml-2">
                    Beta
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  The DEFIT platform is currently in a testing phase. Users are
                  encouraged to submit structured feedback to improve
                  performance, usability, and user experience.
                </p>
              </div>
            </div>

            <div className="ml-14 space-y-3">
              <div className="text-sm">
                <div className="flex items-center gap-1 mb-1">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">Submit to:</span>{" "}
                  <a
                    href="mailto:beta.feedback@defit.mil"
                    className="text-primary hover:underline font-medium"
                  >
                    beta.feedback@defit.mil
                  </a>
                </div>
                <p className="text-muted-foreground text-xs">
                  Subject Line: "DEFIT Beta Feedback"
                </p>
              </div>

              <div className="rounded-xl bg-card/50 border border-border p-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  Please include:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Description of issue or recommendation</li>
                  <li>Screenshot (if applicable)</li>
                  <li>Device / Browser</li>
                  <li>Frequency (one-time or recurring)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* General Inbox */}
      <section className="pb-16">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto glass rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Inbox className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  General Inquiries & Escalation
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                  If you are unsure which POC is appropriate for your inquiry,
                  contact the general inbox. Include your organization, role,
                  and a brief description of the issue to ensure proper routing.
                </p>
                <div className="flex items-center gap-1 text-sm">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <a
                    href="mailto:info@defit.mil"
                    className="text-primary hover:underline font-medium"
                  >
                    info@defit.mil
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BackToTop />
      <Footer />
    </main>
  );
};

export default ContactPOC;
