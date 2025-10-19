import type React from "react"
import { Reveal } from "./reveal"
import { Card } from "@/components/ui/card"

export function UseCases() {
  const cases: { title: string; desc: string; bg: string; fg: string }[] = [
    {
      title: "Co-branded Hunts",
      desc: "Promote products or services creatively. Imagine UberEats x Khoj where clues are designed to pass through specific cafes.",
      bg: "var(--usecase-green)",
      fg: "var(--primary-foreground)",
    },
    {
      title: "Airdrops",
      desc: "Distribute tokens through gamified participation. Dropping tokens taken quite seriously.",
      bg: "var(--usecase-orange)",
      fg: "var(--primary-foreground)",
    },
    {
      title: "Event Engagement",
      desc: "Enhance festivals and expos with interactive hunts. Events for corporates and companies to foster team collaboration.",
      bg: "var(--usecase-gold)",
      fg: "var(--foreground)", // better contrast on gold
    },
    {
      title: "Tourism Promotion",
      desc: "Drive interest in cultural and historical sites. Imagine a tour of the city of Venice through Khoj.",
      bg: "var(--usecase-mauve)",
      fg: "var(--primary-foreground)",
    },
    {
      title: "Fitness Incentives",
      desc: "Gamify physical activity with rewards. Imagine a 5K marathon blended with physical riddle solving.",
      bg: "var(--usecase-red)",
      fg: "var(--primary-foreground)",
    },
    {
      title: "Educational Hunts",
      desc: "Imagine learning about a museum or landmarks through Khoj.",
      bg: "var(--usecase-green)", // green again
      fg: "var(--primary-foreground)",
    },
  ]

  return (
    <section id="use-cases" className="py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-semibold mb-5">Use Cases</h2>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-2.5">
          {cases.map((c, i) => (
            <Reveal key={c.title} delay={i * 90}>
              <Card
                className="relative h-full rounded-md overflow-hidden border-transparent transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:shadow-md p-3 md:p-3.5"
                style={
                  {
                    backgroundColor: "var(--case-bg)",
                    color: "var(--case-fg)",
                    ["--case-bg" as any]: c.bg,
                    ["--case-fg" as any]: c.fg,
                  } as React.CSSProperties
                }
              >
                <h3 className="text-base md:text-lg font-semibold leading-tight">{c.title}</h3>
                <p className="mt-1.5 text-xs sm:text-sm leading-snug opacity-90">{c.desc}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
