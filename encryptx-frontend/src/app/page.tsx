import { Footer } from "./layout/footer"
import { CTASection } from "./components/sections/cta-section"
import { FeaturesSection } from "./components/sections/features-section"
import { HeroSection } from "./components/sections/hero-section"
import { HowItWorksSection } from "./components/sections/how-it-works-section"

/**
 * Renders the main landing page layout by composing the hero, features, how-it-works, call-to-action, and footer sections.
 */
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
