import Navbar from "@/components/Navbar";
import H2FSection from "@/components/H2FSection";
import HeroSection from "@/components/HeroSection";
import ChallengesSection from "@/components/ChallengesSection";
import { AnnouncementsSection } from "@/components/AnnouncementsSection";
import LeaderboardSection from "@/components/LeaderboardSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />
      <HeroSection />
      <H2FSection />
      <AnnouncementsSection />
      <ChallengesSection />
      <LeaderboardSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </main>
  );
};

export default Index;
