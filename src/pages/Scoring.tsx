import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Target, Users, Building2, Shield } from 'lucide-react';

const components = [
  { key: 'A', name: 'Cardio Rank', desc: 'Rank based on total cardio performance (miles). No weekly cap. Higher mileage = better rank.', cap: 'None' },
  { key: 'B', name: 'Resistance Rank', desc: 'Rank based on total resistance/strength performance (lbs). No weekly cap. Higher total weight = better rank.', cap: 'None' },
  { key: 'C', name: 'HIIT Rank', desc: 'Rank based on total HIIT minutes. Capped at 45 minutes per week — any minutes above 45 in a given week are treated as 45 for scoring.', cap: '45 min/week' },
  { key: 'D', name: 'TMAR-M Rank', desc: 'Rank based on total TMAR-M minutes. Capped at 60 minutes per week — any minutes above 60 in a given week are treated as 60 for scoring.', cap: '60 min/week' },
  { key: 'E', name: 'Cumulative Weekly Rank', desc: 'For each of Weeks 1–8, your weekly overall rank (based on that week\'s A+B+C+D component ranks) is computed. E_raw is the sum of those 8 weekly ranks. Then all participants are ranked by E_raw (lower is better). Rewards consistency across weeks.', cap: 'Weeks 1–8' },
  { key: 'F', name: 'Completion Metric', desc: 'Team/Unit/Command only. Combines average completion percentage of pool members with a bonus for total completers in the group. Not used for Individual rankings.', cap: 'Group only' },
];

const levels = [
  { name: 'Individual', icon: Target, formula: 'A + B + C + D + E', tieBreak: 'E → A → B → C → D', pool: 'N/A', notes: 'All active participants ranked against each other.' },
  { name: 'Team', icon: Users, formula: 'A + B + C + D + E + F', tieBreak: 'F → E → A → B → C → D', pool: 'Top 4 members', notes: 'Teams require 4–9 members. Roster locks at Week 4. USAR teams only eligible for medallions. F = avg completion % of top 4.' },
  { name: 'Unit (UIC)', icon: Building2, formula: 'A + B + C + D + E + F', tieBreak: 'F → E → A → B → C → D', pool: 'Top 4 (Small) / Top 6 (Medium) / Top 8 (Large)', notes: 'Min 4 members. Small = <10, Medium = 10–19, Large = 20+. No penalty for non-completers. USAR units only eligible for medallions. F = avg completion % of top N + (completers / total) × 100.' },
  { name: 'Command', icon: Shield, formula: 'A + B + C + D + E + F', tieBreak: 'F → E → A → B → C → D', pool: 'Top 12 members', notes: 'No penalty for non-completers. F = avg completion % of top 12 + (completers / total) × 100.' },
];

export default function Scoring() {
  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />

      <section className="pt-24 pb-16">
        <div className="container px-4 max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/rankings"><ArrowLeft className="w-4 h-4 mr-2" />Back to Rankings</Link>
          </Button>

          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            How <span className="text-gradient">Scoring</span> Works
          </h1>
          <p className="text-muted-foreground text-lg mb-12">
            DEFIT uses an OML-style rank-based scoring system. All components are ranks — lower rank is better. Your total score is the sum of your component ranks, and the lowest total wins.
          </p>

          {/* Key Principle */}
          <div className="glass rounded-2xl p-6 mb-12 border-l-4 border-primary">
            <h2 className="text-xl font-heading font-bold mb-2 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Key Principle
            </h2>
            <p className="text-muted-foreground">
              Every metric is converted to a <strong className="text-foreground">rank</strong> (1st, 2nd, 3rd…) relative to all peers at your level. Your <strong className="text-foreground">Total Score</strong> is the sum of all component ranks. The participant/team/unit/command with the <strong className="text-primary">lowest total score wins</strong>.
            </p>
          </div>

          {/* Components */}
          <h2 className="text-2xl font-heading font-bold mb-6">Scoring Components (A–F)</h2>
          <div className="space-y-4 mb-12">
            {components.map(c => (
              <div key={c.key} className="glass rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-lg font-heading w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0">
                    {c.key}
                  </Badge>
                  <div>
                    <h3 className="font-heading font-bold text-lg">{c.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{c.desc}</p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">Cap: {c.cap}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Levels */}
          <h2 className="text-2xl font-heading font-bold mb-6">Ranking Levels</h2>
          <div className="space-y-6 mb-12">
            {levels.map(l => {
              const Icon = l.icon;
              return (
                <div key={l.name} className="glass rounded-xl p-6">
                  <h3 className="text-xl font-heading font-bold flex items-center gap-2 mb-4">
                    <Icon className="w-5 h-5 text-primary" /> {l.name}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Formula</p>
                      <p className="font-mono font-bold">Total = {l.formula}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Tie-Break Order</p>
                      <p className="font-mono">{l.tieBreak}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Pool Selection</p>
                      <p>{l.pool}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mt-4">{l.notes}</p>
                </div>
              );
            })}
          </div>

          {/* Edge Cases */}
          <h2 className="text-2xl font-heading font-bold mb-6">Edge Cases</h2>
          <div className="glass rounded-xl p-6 space-y-4 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Ties:</strong> If two entities have the same total score, tie-breakers are applied in the specified order. If all tie-breaker components are also equal, they receive the same final rank.</p>
            <p><strong className="text-foreground">Weekly Caps:</strong> HIIT is capped at 45 min/week and TMAR-M at 60 min/week. Excess minutes in a week do not carry over or count toward scoring.</p>
            <p><strong className="text-foreground">Minimum Group Size:</strong> Teams need 4+ members. Units need 4+ active members. Groups below minimum are excluded from rankings.</p>
            <p><strong className="text-foreground">Non-Completers:</strong> At the Unit and Command level, non-completing members do not penalize the group score. They only affect the F component positively if they complete.</p>
            <p><strong className="text-foreground">USAR Eligibility:</strong> Only USAR teams and units are eligible for medallions. Non-USAR entities are ranked but marked as not eligible.</p>
            <p><strong className="text-foreground">Scoring Period:</strong> Only activity logged during Weeks 1–8 of the challenge is counted for ranking calculations.</p>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground text-sm mb-4">
              Questions about scoring? Contact <a href="mailto:info@defit.work" className="text-primary hover:underline">info@defit.work</a>
            </p>
            <Button asChild>
              <Link to="/rankings">View Rankings</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
