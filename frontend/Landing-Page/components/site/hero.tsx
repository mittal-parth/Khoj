import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Reveal } from "./reveal"

export function Hero() {
  return (
    <section id="get-started" className="relative">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-24">
        <Reveal className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h1 className="text-pretty text-4xl md:text-6xl font-semibold leading-tight">Khoj</h1>
            <div className="text-lg text-foreground/70 space-y-4">
              <p>
                {
                  'Khoj (meaning "search" or "discovery" in Hindi) is a geo-location based treasure hunt platform that combines real-world exploration with Web3 technology.'
                }
              </p>
              <p>
                {
                  "Users can participate in location-based treasure hunts where they solve riddles, visit physical locations, and earn on-chain rewards."
                }
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="transition-transform hover:-translate-y-0.5" asChild>
                <Link href="#features">Explore Features</Link>
              </Button>
              <Button variant="secondary" className="transition-colors hover:brightness-95" asChild>
                <Link href="#use-cases">See Use Cases</Link>
              </Button>
            </div>
          </div>

          <Reveal delay={150} className="relative">
            <Image
              src="/illustration-of-treasure-map-and-people-exploring.jpg"
              alt="Illustration of a treasure map and people exploring"
              width={720}
              height={480}
              className="rounded-xl border shadow-sm"
              priority
            />
          </Reveal>
        </Reveal>
      </div>
    </section>
  )
}
