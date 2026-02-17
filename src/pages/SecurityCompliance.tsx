import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import { Shield, Lock, Server, FileCheck, Database, AlertTriangle, Mail } from "lucide-react";

const sections = [
  { id: "overview", label: "Overview" },
  { id: "compliance", label: "Compliance Posture" },
  { id: "data-protection", label: "Data Protection & Encryption" },
  { id: "infrastructure", label: "Infrastructure Security" },
  { id: "application", label: "Application Security" },
  { id: "governance", label: "Data Governance" },
  { id: "incident-response", label: "Incident Response" },
  { id: "contact", label: "Security Contact" },
];

export default function SecurityCompliance() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "DEFIT – Security & Compliance",
      description:
        "Security architecture, compliance posture, and data protection controls for the Double Eagle Fitness Challenge platform.",
      url: window.location.href,
      isPartOf: {
        "@type": "WebSite",
        name: "DEFIT – Double Eagle Fitness Challenge",
        url: window.location.origin,
      },
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />

      {/* Header */}
      <section className="pt-24 pb-12">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Security & Compliance</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              DEFIT <span className="text-gradient">Security & Compliance</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Last Updated: February 2026
            </p>
          </div>
        </div>
      </section>

      {/* Anchor Navigation */}
      <section className="pb-8">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <nav className="glass rounded-xl p-4" aria-label="Page sections">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-heading font-semibold mb-3">
                Table of Contents
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-16">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto space-y-12">

            {/* Overview */}
            <div id="overview" className="scroll-mt-24">
              <SectionHeader icon={Shield} title="Overview" />
              <p className="text-muted-foreground leading-relaxed">
                The Double Eagle Fitness Challenge (DEFIT) platform is designed
                with security, privacy, and operational integrity as foundational
                principles. This page consolidates security architecture,
                compliance posture, and data protection controls in one location
                for transparency and accountability.
              </p>
            </div>

            {/* Compliance Posture */}
            <div id="compliance" className="scroll-mt-24">
              <SectionHeader icon={FileCheck} title="Compliance Posture" />

              {/* SOC 2 Callout */}
              <div className="glass rounded-xl p-6 border border-primary/20 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-foreground mb-1">
                      SOC 2 Type II Certified
                    </h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      DEFIT maintains SOC 2 Type II compliance under the Trust
                      Services Criteria for Security, Availability, and
                      Confidentiality. Independent third-party audits validate
                      the effectiveness of controls over a defined review period.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-heading font-semibold text-foreground mb-3">
                HIPAA Considerations
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                DEFIT is not designed to collect or store Protected Health
                Information (PHI) as defined under HIPAA.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                If any future use case requires handling of PHI, appropriate
                safeguards including encryption, access controls, audit logging,
                and Business Associate Agreements (BAAs) will be implemented
                prior to deployment.
              </p>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200/80">
                  Users are advised not to upload medical records or sensitive
                  health documentation to the platform.
                </p>
              </div>
            </div>

            {/* Data Protection & Encryption */}
            <div id="data-protection" className="scroll-mt-24">
              <SectionHeader icon={Lock} title="Data Protection & Encryption" />
              <div className="space-y-6">
                <SubSection title="Data in Transit">
                  All data transmitted between users and the DEFIT platform is
                  encrypted using TLS 1.2 or higher.
                </SubSection>
                <SubSection title="Data at Rest">
                  Application data is encrypted at rest using industry-standard
                  AES-256 encryption or equivalent cloud-provider encryption
                  mechanisms.
                </SubSection>
                <SubSection title="Access Control">
                  Role-based access controls (RBAC) restrict administrative and
                  operational access based on least-privilege principles.
                </SubSection>
                <SubSection title="Authentication">
                  Secure authentication mechanisms are implemented using modern
                  identity standards. Multi-factor authentication (MFA) is
                  enforced for administrative access.
                </SubSection>
              </div>
            </div>

            {/* Infrastructure Security */}
            <div id="infrastructure" className="scroll-mt-24">
              <SectionHeader icon={Server} title="Infrastructure Security" />
              <div className="space-y-6">
                <SubSection title="Cloud Hosting">
                  DEFIT is hosted within Microsoft Azure Government (Azure Gov),
                  which maintains SOC 2 Type II, ISO 27001, and FedRAMP High
                  certifications.
                </SubSection>
                <SubSection title="Network Security">
                  Firewalls, network segmentation, and managed threat detection
                  services are employed to protect the application environment.
                </SubSection>
                <SubSection title="Monitoring & Logging">
                  Security events, authentication attempts, and administrative
                  actions are logged and continuously monitored. Logs are
                  retained in accordance with defined federal data retention
                  policies.
                </SubSection>
                <SubSection title="Vulnerability Management">
                  Regular dependency updates, automated vulnerability scanning,
                  and penetration testing are conducted. Critical
                  vulnerabilities are prioritized for immediate remediation.
                </SubSection>
              </div>
            </div>

            {/* Application Security Practices */}
            <div id="application" className="scroll-mt-24">
              <SectionHeader icon={FileCheck} title="Application Security Practices" />
              <div className="space-y-6">
                <SubSection title="Secure Development Lifecycle">
                  Code changes follow a controlled development lifecycle
                  including version control, peer review, and change approval
                  procedures.
                </SubSection>
                <SubSection title="Dependency Management">
                  Third-party libraries are continuously monitored for known
                  vulnerabilities and updated as necessary.
                </SubSection>
                <SubSection title="Input Validation">
                  User input is validated and sanitized to reduce risks of
                  injection attacks, cross-site scripting (XSS), and related
                  application-layer threats.
                </SubSection>
              </div>
            </div>

            {/* Data Governance */}
            <div id="governance" className="scroll-mt-24">
              <SectionHeader icon={Database} title="Data Governance" />
              <div className="space-y-6">
                <SubSection title="Data Minimization">
                  DEFIT collects only data necessary for challenge participation
                  and platform functionality.
                </SubSection>
                <SubSection title="Data Retention">
                  User data is retained only as long as operationally necessary
                  and in accordance with Department of Defense data governance
                  policies.
                </SubSection>
                <SubSection title="User Access & Correction">
                  Users may request correction or deletion of personal data,
                  subject to applicable federal retention and records management
                  requirements.
                </SubSection>
              </div>
            </div>

            {/* Incident Response */}
            <div id="incident-response" className="scroll-mt-24">
              <SectionHeader icon={AlertTriangle} title="Incident Response" />
              <p className="text-muted-foreground leading-relaxed mb-3">
                DEFIT maintains a formal incident response protocol designed to
                identify, contain, investigate, and remediate security events.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                In the event of a confirmed data security incident affecting
                users, appropriate stakeholders will be notified in accordance
                with federal reporting requirements and organizational policy.
              </p>
            </div>

            {/* Security Contact */}
            <div id="contact" className="scroll-mt-24">
              <SectionHeader icon={Mail} title="Security Contact" />
              <p className="text-muted-foreground leading-relaxed mb-4">
                Security-related concerns may be reported to:
              </p>
              <div className="glass rounded-xl p-6 inline-flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <a
                  href="mailto:security@defit.mil"
                  className="text-primary font-heading font-semibold hover:underline"
                >
                  security@defit.mil
                </a>
              </div>
            </div>

            {/* Page Footer Note */}
            <div className="pt-8 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Last Updated: February 2026
              </p>
              <div className="flex justify-center gap-4 mt-3 text-xs">
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BackToTop />
      <Footer />
    </main>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
      <Icon className="w-5 h-5 text-primary flex-shrink-0" />
      <h2 className="text-2xl font-heading font-bold text-foreground">{title}</h2>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-heading font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}
