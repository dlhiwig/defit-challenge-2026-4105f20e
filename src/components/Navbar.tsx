import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import defitEmblem from "@/assets/defit-kettlebell-eagle.png.asset.json";
import NotificationBell from "@/components/NotificationBell";
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navLinks = [{
    label: "About",
    href: "/about"
  }, {
    label: "Rules",
    href: "/rules"
  }, {
    label: "Rankings",
    href: "/rankings"
  }, {
    label: "Resources",
    href: "/resources"
  }, {
    label: "Missions",
    href: "/missions"
  }, {
    label: "FAQ",
    href: "/faq"
  }, {
    label: "Register",
    href: "/register"
  }, {
    label: "Dashboard",
    href: "/dashboard"
  }];
  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    return location.pathname === href;
  };
  return <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 sm:h-20 md:h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" aria-label="DEFIT 2027 — Double Eagle Fitness Challenge home">
            <img
              alt="DEFIT 2027 emblem: gold kettlebell with a mirrored double eagle head"
              src={defitEmblem.url}
              width={96}
              height={96}
              decoding="async"
              fetchPriority="high"
              className="h-10 w-10 shrink-0 object-contain sm:h-14 sm:w-14 md:h-20 md:w-20"
            />
            <span className="text-lg font-heading font-bold text-foreground uppercase tracking-wider hidden sm:block">
              DEFIT 2027 
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => link.href.startsWith("/#") ? <a key={link.label} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium uppercase tracking-wide text-sm">
                  {link.label}
                </a> : <Link key={link.label} to={link.href} className={`transition-colors duration-200 font-medium uppercase tracking-wide text-sm ${isActive(link.href) ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {link.label}
                </Link>)}
          </div>

          {/* CTA Button & Notifications */}
          <div className="hidden md:flex items-center gap-2">
            <NotificationBell />
            <Button variant="default" size="default" asChild>
              <Link to="/dashboard">Log Workout</Link>
            </Button>
          </div>

          {/* Mobile Menu Button & Notifications */}
          <div className="md:hidden flex items-center gap-2">
            <NotificationBell />
            <button className="text-foreground p-2" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navLinks.map(link => link.href.startsWith("/#") ? <a key={link.label} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium py-2 uppercase tracking-wide" onClick={() => setIsOpen(false)}>
                    {link.label}
                  </a> : <Link key={link.label} to={link.href} className={`transition-colors duration-200 font-medium py-2 uppercase tracking-wide ${isActive(link.href) ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setIsOpen(false)}>
                    {link.label}
                  </Link>)}
              <Button variant="default" size="default" className="mt-2" asChild>
                <Link to="/dashboard" onClick={() => setIsOpen(false)}>Log Workout</Link>
              </Button>
            </div>
          </div>}
      </div>
    </nav>;
};
export default Navbar;