import { Footer } from "./layout/footer"
import { FeaturesSection } from "./components/sections/features-section"
import { HeroSection } from "./components/sections/hero-section"
import { HowItWorksSection } from "./components/sections/how-it-works-section"

/** Main landing page with hero, features, and process sections */
export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <Footer />
    </div>
  )
}
