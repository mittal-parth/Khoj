import { Navbar } from "@/components/site/navbar"
import { Hero } from "@/components/site/hero"
import { Features } from "@/components/site/features"
import { UseCases } from "@/components/site/use-cases"
import { TechStack } from "@/components/site/tech-stack"
import { Team } from "@/components/site/team"
import { SiteFooter } from "@/components/site/footer"

export default function Home() {
  return (
    <main id="top">
      <Navbar />
      <Hero />
      <Features />
      <UseCases />
      <TechStack />
      <Team />
      <SiteFooter />
    </main>
  )
}
