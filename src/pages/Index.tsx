import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import TargetAudienceSection from "@/components/landing/TargetAudienceSection";
import ProblemsSection from "@/components/landing/ProblemsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import DifferentialsSection from "@/components/landing/DifferentialsSection";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <TargetAudienceSection />
        <ProblemsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <DifferentialsSection />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
