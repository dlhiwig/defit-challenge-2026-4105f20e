import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import { ArrowUp } from "lucide-react";

const Rules = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative" id="top">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              DEFIT 2027 Fitness Challenge <span className="text-gradient">Rules</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              These rules govern participation in the DEFIT 2027 Fitness Challenge hosted in support of wellness and readiness.
              If there is any inconsistency with other materials, <strong className="text-foreground">this web page controls</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-8">
        <div className="container px-4">
          <div className="glass rounded-2xl p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Table of <span className="text-gradient">Contents</span>
            </h2>
            <nav className="grid md:grid-cols-2 gap-2">
              {[
                { id: "overview", label: "1. Overview" },
                { id: "eligibility", label: "2. Eligibility & Registration" },
                { id: "categories", label: "3. Challenge Categories & Minimum Requirements" },
                { id: "scoring", label: "4. Scoring & Leaderboards" },
                { id: "cardio-conversions", label: "5. Cardio Equivalency & Conversions" },
                { id: "logging", label: "6. Logging Workouts & Verification" },
                { id: "fair-play", label: "7. Fair Play & Code of Conduct" },
                { id: "health-safety", label: "8. Health, Safety & Risk" },
                { id: "data-privacy", label: "9. Data, Privacy & Ownership" },
                { id: "changes", label: "10. Changes, Technical Issues & Governance" },
                { id: "acceptance", label: "11. Acceptance of Rules" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-left text-muted-foreground hover:text-primary transition-colors py-1 px-2 rounded hover:bg-primary/10"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="container px-4 pb-16">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Section 1: Overview */}
          <section id="overview" className="glass rounded-2xl p-8 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              1. <span className="text-gradient">Overview</span>
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                The <strong className="text-foreground">DEFIT 2027 Fitness Challenge</strong> is a structured, self-reported fitness event centered on four pillars:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-foreground">Cardio</strong> (Miles)</li>
                <li><strong className="text-foreground">Strength</strong> (Total Weight Lifted)</li>
                <li><strong className="text-foreground">High-Intensity Interval Training</strong> (HIIT Minutes)</li>
                <li><strong className="text-foreground">TMAR-M Minutes</strong> (mobility/recovery/movement sessions as defined in the app)</li>
              </ul>
              <p>
                Participants aim to meet or exceed <strong className="text-foreground">minimum requirements</strong> in each category while earning a <strong className="text-foreground">weighted composite score</strong> for leaderboard placement.
              </p>
              <p className="border-l-2 border-primary/50 pl-4 italic">
                This challenge is <strong className="text-foreground">not</strong> an official Army fitness test. It is a voluntary wellness event that must always be conducted in accordance with medical guidance and command policy.
              </p>
            </div>
            <button onClick={() => scrollToSection("top")} className="mt-6 text-sm text-primary hover:underline flex items-center gap-1">
              <ArrowUp className="w-4 h-4" /> Back to top
            </button>
          </section>

          {/* Section 2: Eligibility & Registration */}
          <section id="eligibility" className="glass rounded-2xl p-8 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              2. <span className="text-gradient">Eligibility & Registration</span>
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">2.1 Age & Status</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You must be at least 18 years old or an emancipated adult under applicable law.</li>
                  <li>Participation may be limited or prohibited where local law, command policy, or medical status forbids fitness challenges.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">2.2 Account Creation</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You must create an account in the DEFIT app/website using accurate, current information.</li>
                  <li>You are responsible for safeguarding your login credentials. All activity under your account is treated as your activity.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">2.3 Authority & Command</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Service members must comply with their chain of command, unit policies, and any relevant safety guidance.</li>
                  <li>Participation is voluntary and must not interfere with duty obligations.</li>
                </ul>
              </div>
            </div>
            <button onClick={() => scrollToSection("top")} className="mt-6 text-sm text-primary hover:underline flex items-center gap-1">
              <ArrowUp className="w-4 h-4" /> Back to top
            </button>
          </section>

          {/* Section 3: Challenge Categories & Minimum Requirements */}
          <section id="categories" className="glass rounded-2xl p-8 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              3. <span className="text-gradient">Challenge Categories & Minimum Requirements</span>
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <p>
                To be considered a <strong className="text-foreground">completer</strong> of the DEFIT 2027 Challenge, you are expected to strive toward the following <strong className="text-foreground">minimum targets</strong> during the official challenge period:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card/50 rounded-xl p-6 border border-border/50">
                  <h3 className="text-xl font-bold text-foreground mb-3">3.1 Cardio – 120 Miles</h3>
                  <p className="mb-2"><strong className="text-foreground">Minimum requirement:</strong> 120 Cardio Miles (after applying conversion rules)</p>
                  <p className="text-sm">Eligible activities:</p>
                  <ul className="list-disc list-inside text-sm ml-2 mt-1">
                    <li>Run / Walk / Ruck</li>
                    <li>Bike</li>
                    <li>Swim</li>
                    <li>Row / Elliptical</li>
                  </ul>
                </div>
                
                <div className="bg-card/50 rounded-xl p-6 border border-border/50">
                  <h3 className="text-xl font-bold text-foreground mb-3">3.2 Strength – 50,000 lbs</h3>
                  <p className="mb-2"><strong className="text-foreground">Minimum requirement:</strong> 50,000 lbs total volume lifted</p>
                  <p className="text-sm mb-2">Calculated as: <strong className="text-foreground">Weight × Reps</strong> (summed across sets)</p>
                  <p className="text-sm italic">Examples: 100 lbs × 10 reps = 1,000 lbs<br/>135 lbs × 5 reps × 3 sets = 2,025 lbs</p>
                </div>
                
                <div className="bg-card/50 rounded-xl p-6 border border-border/50">
                  <h3 className="text-xl font-bold text-foreground mb-3">3.3 HIIT – 480 Minutes</h3>
                  <p className="mb-2"><strong className="text-foreground">Minimum requirement:</strong> 480 minutes of HIIT</p>
                  <p className="text-sm">HIIT should involve repeated intervals of elevated intensity followed by short rest or low-intensity phases.</p>
                </div>
                
                <div className="bg-card/50 rounded-xl p-6 border border-border/50">
                  <h3 className="text-xl font-bold text-foreground mb-3">3.4 TMAR-M – 480 Minutes</h3>
                  <p className="mb-2"><strong className="text-foreground">Minimum requirement:</strong> 480 minutes of TMAR-M sessions</p>
                  <p className="text-sm">Examples: mobility drills, dynamic stretching, movement prep routines, low-intensity purposeful movement sessions.</p>
                </div>
              </div>
              
              <p className="border-l-2 border-primary/50 pl-4 italic">
                <strong className="text-foreground">Note:</strong> The app will display your progress toward each minimum so you can track completion.
              </p>
            </div>
            <button onClick={() => scrollToSection("top")} className="mt-6 text-sm text-primary hover:underline flex items-center gap-1">
              <ArrowUp className="w-4 h-4" /> Back to top
            </button>
          </section>

          {/* Section 4: Scoring & Leaderboards */}
          <section id="scoring" className="glass rounded-2xl p-8 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              4. <span className="text-gradient">Scoring & Leaderboards</span>
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <p>
                Leaderboard rankings in the DEFIT 2027 Challenge are based on a <strong className="text-foreground">weighted composite score</strong> that combines all four categories.
              </p>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">4.1 Category Weights</h3>
                <p className="mb-3">Each category contributes a fixed percentage to your overall challenge score:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary">30%</div>
                    <div className="text-sm">Cardio</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary">30%</div>
                    <div className="text-sm">Strength</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary">20%</div>
                    <div className="text-sm">HIIT</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary">20%</div>
                    <div className="text-sm">TMAR-M</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">4.2 Completion Percentage per Category</h3>
                <p className="mb-2">For each category, you earn a completion percentage based on progress:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>Cardio % = (Your Challenge Miles ÷ 120) × 100</li>
                  <li>Strength % = (Your Total Volume ÷ 50,000 lbs) × 100</li>
                  <li>HIIT % = (Your HIIT Minutes ÷ 480) × 100</li>
                  <li>TMAR-M % = (Your TMAR-M Minutes ÷ 480) × 100</li>
                </ul>
                <p className="text-sm mt-2 italic">
                  Percentages may be capped at 100% for scoring, or overperformance may contribute if specified in the app.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">4.3 Weighted Composite Score</h3>
                <div className="bg-card/50 rounded-lg p-4 border border-border/50">
                  <p className="font-mono text-sm">
                    <strong className="text-foreground">Overall Score</strong> = (Cardio % × 0.30) + (Strength % × 0.30) + (HIIT % × 0.20) + (TMAR-M % × 0.20)
                  </p>
                </div>
                <p className="text-sm mt-2">This produces a 0–100 style score (or slightly above 100 if overachievement is allowed).</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">4.4 Ties & Adjustments</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>In the event of a tie, organizers may use tie-breakers such as highest combined completion or earliest completion of all minimums.</li>
                  <li>Organizers reserve the right to correct data errors, remove invalid entries, or adjust scores to preserve fairness.</li>
                </ul>
              </div>
            </div>
            <button onClick={() => scrollToSection("top")} className="mt-6 text-sm text-primary hover:underline flex items-center gap-1">
              <ArrowUp className="w-4 h-4" /> Back to top
            </button>
          </section>

          {/* Section 5: Cardio Conversions */}
          <section id="cardio-conversions" className="glass rounded-2xl p-8 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              5. <span className="text-gradient">Cardio Equivalency & Conversions</span>
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <p>
                To keep things fair across different cardio types, all activities are converted into <strong className="text-foreground">Cardio Miles</strong> using standard equivalency rules.
              </p>
              <p className="border-l-2 border-primary/50 pl-4 italic">
                <strong className="text-foreground">Key idea:</strong> Activities with lower mechanical load but similar time-effort (like cycling) require more raw distance to equal one Cardio Mile.
              </p>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">5.1 Default Conversion Rules for 2027</h3>
                <div className="space-y-4">
                  <div className="bg-card/50 rounded-lg p-4 border border-border/50">
                    <h4 className="font-semibold text-foreground">Run / Walk / Ruck</h4>
                    <p className="text-sm">1 real mile = <strong className="text-primary">1.0 Cardio Mile</strong></p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-4 border border-border/50">
                    <h4 className="font-semibold text-foreground">Bike (Outdoor or Stationary)</h4>
                    <p className="text-sm">3 bike miles = <strong className="text-primary">1.0 Cardio Mile</strong></p>
                    <p className="text-sm italic">Cardio Miles = Bike Miles ÷ 3</p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-4 border border-border/50">
                    <h4 className="font-semibold text-foreground">Swim</h4>
                    <p className="text-sm">0.25 swim miles = <strong className="text-primary">1.0 Cardio Mile</strong></p>
                    <p className="text-sm italic">Cardio Miles = Swim Miles × 4</p>
                    <p className="text-sm italic">For metric pools: 400 m ≈ 0.25 mile ≈ 1.0 Cardio Mile</p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-4 border border-border/50">
                    <h4 className="font-semibold text-foreground">Row / Elliptical</h4>
                    <p className="text-sm">1 row/elliptical mile = <strong className="text-primary">1.0 Cardio Mile</strong> (run-equivalent)</p>
                    <p className="text-sm italic">If tracking meters: 1,600 m ≈ 1.0 Cardio Mile</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">5.2 Logging Units</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>When possible, the app will let you log distance in miles or meters, and perform conversions automatically into Cardio Miles.</li>
                  <li>If entering manually, follow the conversion rules above to avoid over- or under-reporting.</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">5.3 Changes to Conversion Rules</h3>
                <p>
                  These conversions are the standard for the 2027 Challenge. Organizers may correct obvious unit mistakes and may clarify or refine conversions if needed. Any changes will be announced in-app or on the website.
                </p>
              </div>
            </div>
            <button onClick={() => scrollToSection("top")} className="mt-6 text-sm text-primary hover:underline flex items-center gap-1">
              <ArrowUp className="w-4 h-4" /> Back to top
            </button>
          </section>

          {/* Section 6: Logging & Verification */}
          <section id="logging" className="glass rounded-2xl p-8 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              6. <span className="text-gradient">Logging Workouts & Verification</span>
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">6.1 Self-Reporting</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All workouts are self-reported unless otherwise integrated with devices or apps.</li>
                  <li>You must only log activities you personally performed during the official challenge period.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">6.2 Accuracy</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Cardio logs must reflect real distances and durations.</li>
                  <li>Strength logs must reflect actual weight × reps performed.</li>
                  <li>HIIT and TMAR-M logs must reflect actual minutes spent in those sessions.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">6.3 Verification</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>For top performers or in cases of irregular data, organizers may request reasonable verification (e.g., screenshots from fitness apps, device logs).</li>
                  <li>Failure to provide reasonable verification may result in score adjustment or disqualification.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">6.4 Editing & Deletion</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Minor corrections to logs are allowed within the limits set by the app.</li>
                  <li>Repeated editing to chase scores or obvious manipulation may trigger review and possible penalties.</li>
                </ul>
              </div>
            </div>
            <button onClick={() => scrollToSection("top")} className="mt-6 text-sm text-primary hover:underline flex items-center gap-1">
              <ArrowUp className="w-4 h-4" /> Back to top
            </button>
          </section>

          {/* Section 7: Fair Play */}
          <section id="fair-play" className="glass rounded-2xl p-8 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              7. <span className="text-gradient">Fair Play & Code of Conduct</span>
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">7.1 Cheating</h3>
                <p className="mb-2">Cheating includes, but is not limited to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Logging workouts you did not complete</li>
                  <li>Logging someone else's activity as your own</li>
                  <li>Artificially manipulating devices or apps to inflate distances or times</li>
                  <li>Using bots, scripts, or other tools to submit fake data</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">7.2 Behavior</h3>
                <p className="mb-2">Participants must:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Treat other participants, volunteers, and organizers with respect</li>
                  <li>Avoid harassment, hate speech, threats, or discriminatory conduct</li>
                  <li>Avoid posting or uploading illegal, explicit, or otherwise inappropriate content</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">7.3 Consequences</h3>
                <p className="mb-2">Violations may result in:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Removal from the Challenge</li>
                  <li>Deletion or adjustment of logged data</li>
                  <li>Ineligibility for prizes, recognition, or future events</li>
                </ul>
              </div>
            </div>
            <button onClick={() => scrollToSection("top")} className="mt-6 text-sm text-primary hover:underline flex items-center gap-1">
              <ArrowUp className="w-4 h-4" /> Back to top
            </button>
          </section>

          {/* Section 8: Health & Safety */}
          <section id="health-safety" className="glass rounded-2xl p-8 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              8. <span className="text-gradient">Health, Safety & Risk</span>
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">8.1 Medical Clearance</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You are responsible for ensuring you are medically cleared for vigorous exercise.</li>
                  <li>Always follow guidance from your medical provider and, if applicable, your chain of command.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">8.2 Warning Signs</h3>
                <p className="mb-2">Stop exercising and seek medical attention if you experience:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Chest pain or tightness</li>
                  <li>Unusual shortness of breath</li>
                  <li>Dizziness or faintness</li>
                  <li>Severe pain or any concerning symptoms</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">8.3 No Medical Advice</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The DEFIT platform and organizers do <strong className="text-foreground">not</strong> provide medical advice.</li>
                  <li>Participation is at your own risk.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">8.4 Environment & Equipment</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Choose safe locations to train.</li>
                  <li>Use appropriate footwear, clothing, and equipment.</li>
                  <li>Follow all local safety requirements (traffic, weather, terrain, etc.).</li>
                </ul>
              </div>
            </div>
            <button onClick={() => scrollToSection("top")} className="mt-6 text-sm text-primary hover:underline flex items-center gap-1">
              <ArrowUp className="w-4 h-4" /> Back to top
            </button>
          </section>

          {/* Section 9: Data & Privacy */}
          <section id="data-privacy" className="glass rounded-2xl p-8 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              9. <span className="text-gradient">Data, Privacy & Ownership</span>
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">9.1 Self-Disclosure</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You control what personal information you choose to provide.</li>
                  <li>Only information you voluntarily enter into the platform will be used for participation, analytics, and leaderboards as described in the Privacy Policy.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">9.2 No Selling of Personal Data</h3>
                <p>
                  Your personal information will <strong className="text-foreground">not</strong> be sold or shared with third parties for their independent marketing purposes.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">9.3 Ownership</h3>
                <p>
                  All platform content, software, branding, and challenge materials are produced for and retained by <strong className="text-foreground">The Black Eagle Project Inc., a non-profit 501(c)(3)</strong>, unless explicitly stated otherwise.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">9.4 Privacy Policy</h3>
                <p>
                  Additional details about data collection, storage, and protection are contained in the separate <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>. Participation in the challenge requires agreement to both these Rules and the Privacy Policy.
                </p>
              </div>
            </div>
            <button onClick={() => scrollToSection("top")} className="mt-6 text-sm text-primary hover:underline flex items-center gap-1">
              <ArrowUp className="w-4 h-4" /> Back to top
            </button>
          </section>

          {/* Section 10: Changes & Governance */}
          <section id="changes" className="glass rounded-2xl p-8 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              10. <span className="text-gradient">Changes, Technical Issues & Governance</span>
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">10.1 Modifications</h3>
                <p>
                  The organizers may modify these rules, scoring methods, or challenge parameters if necessary (for example, security issues, technical problems, or operational needs).
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">10.2 Technical Issues</h3>
                <p className="mb-2">The organizers are not responsible for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Device failures</li>
                  <li>Connectivity issues</li>
                  <li>Lost or corrupted data</li>
                  <li>Other technical problems that affect your ability to log workouts or view results</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">10.3 Official Communications</h3>
                <p>
                  Any major changes or clarifications will be communicated via the app and/or the official challenge website.
                </p>
              </div>
            </div>
            <button onClick={() => scrollToSection("top")} className="mt-6 text-sm text-primary hover:underline flex items-center gap-1">
              <ArrowUp className="w-4 h-4" /> Back to top
            </button>
          </section>

          {/* Section 11: Acceptance */}
          <section id="acceptance" className="glass rounded-2xl p-8 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              11. <span className="text-gradient">Acceptance of Rules</span>
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                By creating an account, logging any activity, or otherwise participating in the <strong className="text-foreground">DEFIT 2027 Fitness Challenge</strong>, you confirm that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You have read and understood these Rules</li>
                <li>You agree to be bound by these Rules, the <a href="/terms" className="text-primary hover:underline">Terms of Service</a>, and the <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a></li>
                <li>You accept personal responsibility for your health, safety, and conduct during the Challenge</li>
              </ul>
            </div>
            <button onClick={() => scrollToSection("top")} className="mt-6 text-sm text-primary hover:underline flex items-center gap-1">
              <ArrowUp className="w-4 h-4" /> Back to top
            </button>
          </section>

        </div>
      </div>

      <BackToTop />
      <Footer />
    </main>
  );
};

export default Rules;