import { Footer } from "./layout/footer"
import { CTASection } from "./components/sections/cta-section"
import { FeaturesSection } from "./components/sections/features-section"
import { HeroSection } from "./components/sections/hero-section"
import { HowItWorksSection } from "./components/sections/how-it-works-section"

/** Main landing page with hero, features, and CTA sections */
export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  )
}
