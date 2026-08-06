import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ExternalLink, FileText, Video, BookOpen, Heart, Brain, Apple, Moon, Play } from "lucide-react";

const featuredVideos = [
  {
    title: "Holistic Health & Fitness: Optimal Readiness and Lethality",
    url: "https://www.youtube.com/watch?v=fRM-fPeVs0k",
    thumbnail: "https://img.youtube.com/vi/fRM-fPeVs0k/hqdefault.jpg",
    source: "Defense Visual Information",
    duration: "5:32",
  },
  {
    title: "ALL YOU — Army H2F Wellness Series",
    url: "https://www.youtube.com/watch?v=BzZ3NWTs4Mo",
    thumbnail: "https://img.youtube.com/vi/BzZ3NWTs4Mo/hqdefault.jpg",
    source: "GoArmy",
    duration: "0:31",
  },
  {
    title: "Army Combat Fitness Test (ACFT) Demonstration",
    url: "https://www.youtube.com/watch?v=WHpkSBc04aA",
    thumbnail: "https://img.youtube.com/vi/WHpkSBc04aA/hqdefault.jpg",
    source: "U.S. Department of Defense",
    duration: "3:36",
  },
  {
    title: "Leaders Discuss the H2F System",
    url: "https://www.youtube.com/watch?v=nqu05z72LWo",
    thumbnail: "https://img.youtube.com/vi/nqu05z72LWo/hqdefault.jpg",
    source: "US Army Physical Fitness School",
    duration: "2:10",
  },
  {
    title: "ACFT Sprint-Drag-Carry Training",
    url: "https://www.youtube.com/watch?v=PJc1xkiYL7c",
    thumbnail: "https://img.youtube.com/vi/PJc1xkiYL7c/hqdefault.jpg",
    source: "US Army Physical Fitness School",
    duration: "6:48",
  },
  {
    title: "ACFT Event Breakdown & Standards",
    url: "https://www.youtube.com/watch?v=RnVTW1Lh7zk",
    thumbnail: "https://img.youtube.com/vi/RnVTW1Lh7zk/hqdefault.jpg",
    source: "U.S. Department of Defense",
    duration: "2:16",
  },
];

const resourceCategories = [
  {
    title: "Training Resources",
    icon: FileText,
    resources: [
      { name: "FM 7-22 Holistic Health and Fitness", url: "https://h2f.army.mil/H2F-Academy/", type: "PDF" },
      { name: "ACFT Training Guide", url: "https://h2f.army.mil/Portals/141/pdfs/physical/ACFT%20Prep%20Guide.pdf", type: "PDF" },
      { name: "Ruck March Preparation (ATP 3-21.18)", url: "https://armypubs.army.mil/epubs/DR_pubs/DR_a/ARN35163-ATP_3-21.18-000-WEB-1.pdf", type: "PDF" },
      { name: "Progressive Overload Fundamentals", url: "https://www.hprc-online.org/physical-fitness/training-performance/guidelines-progress-your-physical-training-over-time", type: "Article" },
    ],
  },
  {
    title: "Nutrition",
    icon: Apple,
    resources: [
      { name: "Warfighter Nutrition Guide", url: "https://h2f.army.mil/Portals/141/pdfs/nutrition/HPRC%20Warfighter%20Nutrition%20Guide.pdf", type: "PDF" },
      { name: "Sample 7-Day Meal Plan", url: "https://www.hprc-online.org/nutrition/fighting-weight-strategies/sample-7-day-meal-plan", type: "Article" },
      { name: "Hydration Calculator", url: "https://www.hprc-online.org/nutrition/performance-nutrition/calculate-your-hydration-needs-fluid-replacement-worksheet", type: "Tool" },
      { name: "Nutrient Timing & Training", url: "https://www.hprc-online.org/nutrition/warfighter-nutrition-guide/9-nutrient-timing-and-training", type: "Article" },
    ],
  },
  {
    title: "Mental Readiness",
    icon: Brain,
    resources: [
      { name: "Mental Skills Training", url: "https://www.army.mil/article/284983/improving_soldier_performance_with_mental_skills_training", type: "Article" },
      { name: "Stress Management Resources", url: "https://www.hprc-online.org/mental-fitness/stress/resources-manage-stress", type: "Article" },
      { name: "SMART Goal Setting Worksheet", url: "https://www.hprc-online.org/mental-fitness/performance-psychology/smart-goals-worksheet-performance-optimization", type: "Template" },
      { name: "Mental Imagery for Performance", url: "https://www.hprc-online.org/mental-fitness/performance-psychology/imagery-action-strategies-strengthen-and-apply-mental-imagery", type: "Article" },
    ],
  },
  {
    title: "Recovery & Sleep",
    icon: Moon,
    resources: [
      { name: "Sleep Optimization Workbook", url: "https://www.hprc-online.org/mental-fitness/sleep/sleep-workbook-tools-optimize-your-sleep", type: "Article" },
      { name: "Active Recovery Guide", url: "https://www.hprc-online.org/physical-fitness/injury-prevention/add-active-recovery-your-workout", type: "Article" },
      { name: "Flexibility & Mobility Training", url: "https://www.hprc-online.org/physical-fitness/training-performance/pftprt-training-series-part-3-flexibility-and-mobility", type: "Article" },
      { name: "Rx3: Rehab, Refit, Return to Duty", url: "https://www.hprc-online.org/physical-fitness/rx3", type: "Article" },
    ],
  },
  {
    title: "Spiritual Readiness",
    icon: Heart,
    resources: [
      { name: "Army Spiritual Fitness Guide 2025", url: "https://api.army.mil/e2/c/downloads/2025/08/01/0437a07e/u-s-army-spiritual-fitness-guide-2025.pdf", type: "PDF" },
      { name: "Mindfulness for the Military", url: "https://www.hprc-online.org/mental-fitness/stress/mindfulness-military", type: "Article" },
      { name: "Building Resilience", url: "https://www.hprc-online.org/total-force-fitness/tff-strategies/tff-tools-boost-brain-health-build-resilience", type: "Article" },
      { name: "H2F Spiritual Domain", url: "https://h2f.army.mil/Domains/Spiritual-Domain/", type: "External" },
    ],
  },
];

const safetyTips = [
  "Always warm up for 5-10 minutes before intense activity",
  "Stay hydrated—drink water before, during, and after workouts",
  "Listen to your body—rest if you experience pain or excessive fatigue",
  "Use proper form to prevent injury, especially during strength training",
  "Progress gradually—don't increase intensity more than 10% per week",
  "Get adequate sleep (7-9 hours) for optimal recovery",
  "Report injuries to your unit medical personnel",
  "Train with a battle buddy when possible for safety and motivation",
];

const Resources = () => {
  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              H2F <span className="text-gradient">Resources</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Training guides, nutrition info, mental readiness tools, and safety guidelines 
              to support your fitness journey.
            </p>
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-16">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {resourceCategories.map((category) => (
              <div key={category.title} className="glass rounded-2xl p-6 card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{category.title}</h3>
                </div>
                <ul className="space-y-3">
                  {category.resources.map((resource) => (
                    <li key={resource.name}>
                      <a
                        href={resource.url}
                        className="flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <span className="text-sm">{resource.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                            {resource.type}
                          </span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Videos */}
      <section className="py-16">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Video className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">
                Featured <span className="text-gradient">Videos</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVideos.map((video) => (
                <a
                  key={video.title}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-2xl overflow-hidden card-hover group block"
                >
                  <div className="relative aspect-video bg-secondary">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallback) {
                          img.dataset.fallback = "1";
                          img.src = img.src.replace("hqdefault.jpg", "mqdefault.jpg");
                        } else {
                          img.style.display = "none";
                        }
                      }}
                    />

                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                        <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 text-xs bg-black/70 text-white px-2 py-0.5 rounded">
                      {video.duration}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{video.source}</p>
                  </div>
                </a>
              ))}
            </div>
            <div className="mt-6 text-center">
              <a
                href="https://www.youtube.com/@USArmyPhysicalFitnessSchool"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View more on the US Army Physical Fitness School channel
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Guidelines */}
      <section className="py-16">
        <div className="container px-4">
          <div className="glass rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
              Safety <span className="text-gradient">Guidelines</span>
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Your safety is the priority. Follow these guidelines to train smart and stay injury-free.
            </p>
            <ul className="grid md:grid-cols-2 gap-4">
              {safetyTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </span>
                  <span className="text-muted-foreground text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* External Links */}
      <section className="py-16">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Official <span className="text-gradient">Links</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: "Army H2F Program", url: "https://h2f.army.mil/" },
                { name: "ACFT Standards", url: "https://www.army.mil/acft/" },
                { name: "Army Wellness Center", url: "https://phc.amedd.army.mil/topics/healthyliving/al/Pages/ArmyWellnessCenters.aspx" },
                { name: "Military OneSource", url: "https://www.militaryonesource.mil/" },
              ].map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">{link.name}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Resources;
