import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Heart, Brain, Apple, Moon } from "lucide-react";

const h2fDomains = [
  {
    icon: Shield,
    title: "Physical Readiness",
    description: "Build strength, endurance, and combat-ready fitness through structured cardio, strength, HIIT, and TMAR-M training.",
    primary: true,
  },
  {
    icon: Heart,
    title: "Spiritual Readiness",
    description: "Sustain a communal environment that promotes synergy with the Army's mission while balanced with each individual's identity.",
    primary: true,
  },
  {
    icon: Brain,
    title: "Mental Readiness",
    description: "Develop mental toughness, focus, and resilience to overcome challenges both on and off duty.",
    primary: false,
  },
  {
    icon: Apple,
    title: "Nutritional Readiness",
    description: "Fuel your body with proper nutrition strategies for sustained energy and peak performance.",
    primary: false,
  },
  {
    icon: Moon,
    title: "Sleep Readiness",
    description: "Optimize recovery through proper sleep protocols to maintain peak performance and prevent injury.",
    primary: false,
  },
];

const About = () => {
  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              What is <span className="text-gradient">DEFIT?</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              The Double Eagle Fitness Challenge is a ten-week holistic health and fitness (H2F) 
              program designed for individuals, teams, and units across the United States Army Reserve.
            </p>
          </div>
        </div>
      </section>

      {/* Purpose Section */}
      <section className="py-16">
        <div className="container px-4">
          <div className="glass rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
              Our <span className="text-gradient">Purpose</span>
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">Reserve Ready. Unit Strong.</strong> The goal of DEFIT 
                is to enhance comprehensive lethality and wellness in the United States Army Reserve (AR), 
                while fostering a sense of community, strengthening Army identity, and providing a safe 
                training environment for all participants.
              </p>
              <p>
                An emphasis on physical readiness is critical, especially in the AR, where part-time 
                operations present unique challenges in maintaining a steady state of physical activity 
                and wellness. DEFIT is an annual Reserve tradition that focuses primarily on the 
                <strong className="text-primary"> Physical</strong> and 
                <strong className="text-primary"> Spiritual</strong> domains of the H2F system.
              </p>
              <p>
                The methodology encompasses a competitive challenge comprised of a series of activities 
                to encourage individuals, teams, and units to strive for peak performance. This approach 
                enables recognition and celebration of individuals who demonstrate exceptional readiness 
                and contributions, regardless of whether they are part of a winning team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* H2F Domains */}
      <section className="py-16">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              The Five <span className="text-gradient">H2F Domains</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The H2F System is comprised of five domains. DEFIT focuses primarily on 
              Physical and Spiritual readiness while supporting all domains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {h2fDomains.map((domain) => (
              <div 
                key={domain.title} 
                className={`glass rounded-2xl p-6 card-hover ${domain.primary ? 'border-primary/30' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  domain.primary ? 'bg-primary/20' : 'bg-primary/10'
                }`}>
                  <domain.icon className={`w-6 h-6 ${domain.primary ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-foreground">{domain.title}</h3>
                  {domain.primary && (
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-wide">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">{domain.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Challenge Details */}
      <section className="py-16">
        <div className="container px-4">
          <div className="glass rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
              The <span className="text-gradient">Challenge</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-heading font-bold text-gradient">11 Jan</div>
                <div className="text-muted-foreground text-sm uppercase tracking-wide">Challenge Begins</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-heading font-bold text-gradient">10 Weeks</div>
                <div className="text-muted-foreground text-sm uppercase tracking-wide">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-heading font-bold text-gradient">21 Mar</div>
                <div className="text-muted-foreground text-sm uppercase tracking-wide">Challenge Ends</div>
              </div>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Data verification is <strong className="text-foreground">integrity based</strong> and 
                entered by individual Soldiers on this website. Designated personnel within the 
                United States Army Reserve Command (USARC) will validate and calculate the scores.
              </p>
              <p>
                Throughout the challenge, participants should maintain comprehensive records of their 
                workouts. Accurate record-keeping supports efficient validation and the integrity of 
                data when the verification process is required.
              </p>
              <p>
                A scoring algorithm posted to the DEFIT website will rank individuals, teams, and units.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Competition Categories */}
      <section className="py-16">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Competition <span className="text-gradient">Categories</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="glass rounded-2xl p-6">
                <div className="text-4xl font-heading font-bold text-gradient mb-2">Individual</div>
                <p className="text-muted-foreground text-sm">Compete as a single Soldier</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="text-4xl font-heading font-bold text-gradient mb-2">Team</div>
                <p className="text-muted-foreground text-sm">Small groups competing together</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="text-4xl font-heading font-bold text-gradient mb-2">Unit</div>
                <p className="text-muted-foreground text-sm">Small, medium, and large units</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default About;
