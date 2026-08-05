import { Link } from "react-router-dom";
import { Mail, Instagram, Facebook, Youtube } from "lucide-react";

const footerLinks = {
  Challenge: [
    { label: "About DEFIT", href: "/about" },
    { label: "Rules & Scoring", href: "/rules" },
    { label: "Leaderboard", href: "/leaderboard" },
  ],
  Resources: [
    { label: "H2F Resources", href: "/resources" },
    { label: "Training Tips", href: "/resources" },
    { label: "Safety Guidelines", href: "/resources" },
  ],
  Support: [
    { label: "Contact POC", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Report Issue", href: "/report-issue" },
  ],
};

const socialLinks = [
  { icon: Mail, href: "mailto:info@defit.work", label: "Email" },
  // TODO: Add real social media links when available
  // { icon: Instagram, href: "#", label: "Instagram" },
  // { icon: Facebook, href: "#", label: "Facebook" },
  // { icon: Youtube, href: "#", label: "YouTube" },
];

const Footer = () => {
  return (
    <footer className="py-16 border-t-2 border-primary">
      <div className="container px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col items-center">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img
                alt="DEFIT Challenge"
                className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 object-contain"
                src={`${import.meta.env.BASE_URL}lovable-uploads/cc2d9315-be04-4d2c-a390-e524797420ec.png`}
              />
            </Link>
            <p className="text-muted-foreground text-sm text-center italic">
              "Twice the Citizen, Combat Ready"
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-heading font-semibold text-foreground mb-4 uppercase tracking-wide">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/#") || link.href.startsWith("#") ? (
                      <a
                        href={link.href}
                        className="relative text-muted-foreground hover:text-primary transition-colors text-sm after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-primary after:transition-all hover:after:w-full"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="relative text-muted-foreground hover:text-primary transition-colors text-sm after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-primary after:transition-all hover:after:w-full"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Links */}
        <div className="flex justify-center gap-6 mb-8">
          {socialLinks.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="text-muted-foreground hover:text-primary transition-colors"
              target={href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
            >
              <Icon size={22} />
            </a>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="pt-8 border-t border-border">
          <p className="text-muted-foreground text-xs text-center mb-4">
            <strong>Disclaimer:</strong> Results are unofficial until validated
            by USARC representatives. This challenge is for fitness motivation
            purposes and does not replace official Army fitness assessments.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              © 2027 Double Eagle Fitness Challenge. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              <Link
                to="/privacy"
                className="hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/security"
                className="hover:text-primary transition-colors"
              >
                Security & Compliance
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
