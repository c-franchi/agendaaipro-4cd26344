import BackToTop from "@/components/landing/BackToTop";
import YourPlatformSection from "@/components/landing/YourPlatformSection";
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
import CaseStudySection from "@/components/landing/CaseStudySection";
import ResponsibilitiesSection from "@/components/landing/ResponsibilitiesSection";
import FAQSection from "@/components/landing/FAQSection";
import ContactSection from "@/components/landing/ContactSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <YourPlatformSection />
        <PartnersSection />
        <VideoSection />
        <CaseStudySection />
        <TargetAudienceSection />
        <ProblemsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <DifferentialsSection />
        <PricingSection />
        <ResponsibilitiesSection />
        <FAQSection />
        <CTASection />
        <ContactSection />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Index;
