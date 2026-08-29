import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Features } from "@/components/marketing/Features";
import { TechStackSection } from "@/components/marketing/TechStackSection";
import { FinalCta } from "@/components/marketing/FinalCta";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function MarketingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <MarketingNav />
      <main>
        <MarketingHero />
        <HowItWorks />
        <Features />
        <TechStackSection />
        <FinalCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
