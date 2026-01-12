import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import PartnersSection from "@/components/landing/PartnersSection";
import VideoSection from "@/components/landing/VideoSection";
import TargetAudienceSection from "@/components/landing/TargetAudienceSection";
import ProblemsSection from "@/components/landing/ProblemsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import DifferentialsSection from "@/components/landing/DifferentialsSection";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import ContactSection from "@/components/landing/ContactSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <PartnersSection />
        <VideoSection />
        <TargetAudienceSection />
        <ProblemsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <DifferentialsSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
