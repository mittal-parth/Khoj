"use client"

import { Reveal } from "./reveal"
import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"

type Item = { name: string; image?: string }
type Group = { title: string; items: Item[] }

const groups: Group[] = [
  {
    title: "Frontend",
    items: [
      { name: "ReactJs", image: "https://cdn.worldvectorlogo.com/logos/react-2.svg" },
      { name: "Netlify", image: "https://cdn.worldvectorlogo.com/logos/netlify.svg" },
      { name: "TailwindCSS", image: "https://cdn.worldvectorlogo.com/logos/tailwind-css-2.svg" },
    ],
  },
  {
    title: "Backend & Contracts",
    items: [
      { name: "ExpressJs", image: "https://cdn.worldvectorlogo.com/logos/expressjs.svg" },
      { name: "Solidity", image: "https://cdn.worldvectorlogo.com/logos/solidity.svg" },
      { name: "Base", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRITFxtiOGzgvBLsncvyYa-ZFxpjqooNewwYvSVbD4xq_8M8CfbuXK94ilifqZ84ckHJCI&usqp=CAU" },
      { name: "Flow", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQ2pQizXRnDoDnKo4TtO0OzNWS72rYDeQJ2Q&s" },
      { name: "Moonbeam", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_D1sKRZOcTWyrOnBB5R0OFfQM2fmL2pM93Q&s" },
      { name: "Polkadot", image: "https://1000logos.net/wp-content/uploads/2022/08/Polkadot-Emblem-768x432.png" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { name: "IPFS", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUVRSzWvAmjAg7JVu6JJPv_yOuEXe_EH1T3A&s" },
      { name: "Lit Protocol", image: "https://lw3-teams-logos.s3.us-east-2.amazonaws.com/Lit%20Protocol-team-logo" },
      { name: "Huddle01", image: "https://media.licdn.com/dms/image/v2/D560BAQGlnRmbg3ZhRQ/company-logo_200_200/company-logo_200_200/0/1694608348469/huddle_01_logo?e=2147483647&v=beta&t=JUVOnKVDOQk65GcoLNxUcxDcsdjpZIddxdoyEUEGHdk" },
      { name: "True Network", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6kaBloQgjVw6EMerR0dlnErfEkcOI9UGISA&s" },
      { name: "Gemini", image: "https://cdn.worldvectorlogo.com/logos/gemini-icon-logo.svg" },
      { name: "ThirdWeb", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsyo9Tv82kGfXd3Rgeb-3NtZKwGYi80Jpo_Q&s" },
    ],
  },
]

function initials(name: string) {
  const words = name.split(" ")
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase()
  const cap = name.replace(/[^A-Za-z]/g, "")
  const picks = cap.match(/[A-Z]/g)
  if (picks && picks.length >= 2) return `${picks[0]}${picks[1]}`
  return cap.slice(0, 2).toUpperCase()
}

// ImageWithFallback with preloading
function ImageWithFallback({
  src,
  alt,
  fallbackQuery,
}: {
  src?: string
  alt: string
  fallbackQuery: string
}) {
  const [loadedSrc, setLoadedSrc] = useState<string>()
  const placeholder = `/logo-placeholder-for-.jpg?key=vxa6c&height=64&width=64&query=${encodeURIComponent(
    fallbackQuery
  )}`

  useEffect(() => {
    const img = new Image()
    img.src = src || placeholder
    img.onload = () => setLoadedSrc(src)
    img.onerror = () => setLoadedSrc(placeholder)
  }, [src, placeholder])

  return (
    <img
      src={loadedSrc || placeholder}
      alt={alt}
      className="h-10 w-10 rounded-full object-contain transition-all duration-200"
      loading="lazy"
    />
  )
}

export function TechStack() {
  return (
    <section id="tech" className="py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">Tech stack</h2>
        </Reveal>

        <div className="flex flex-col gap-4 md:gap-6">
          {groups.map((group, gi) => {
            const isColored = gi === 0 || gi === 2
            const bgVar =
              gi === 0
                ? "var(--usecase-orange)"
                : gi === 1
                ? "var(--surface-white)"
                : "var(--usecase-green)"
            const textToken = isColored ? "text-[color-on-colored]" : "text-foreground"
            const subTextToken = isColored ? "text-[color-on-colored]/90" : "text-muted-foreground"

            return (
              <Reveal key={group.title} delay={gi * 60}>
                <Card
                  className={`group/card overflow-hidden rounded-xl transition-all duration-300 will-change-transform ${textToken} shadow-sm hover:-translate-y-1 hover:shadow-md`}
                  style={{ backgroundColor: bgVar }}
                >
                  <div className="p-4 md:p-5">
                    <h3 className="text-lg font-semibold mb-4 text-center">{group.title}</h3>

                    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-y-4 gap-x-3 place-items-center">
                      {group.items.map((it) => (
                        <li
                          key={it.name}
                          className="group/item flex flex-col items-center gap-2 rounded-lg p-1 transition-all duration-200 hover:-translate-y-0.5"
                        >
                          <div className="relative">
                            <span
                              className="pointer-events-none absolute inset-0 rounded-full blur-xl opacity-40 transition-opacity duration-200 group-hover/item:opacity-70"
                              aria-hidden="true"
                            />
                            <div
                              className="relative h-16 w-16 rounded-full flex items-center justify-center ring-1 ring-foreground/10 shadow-sm transition-all duration-200 group-hover/item:ring-foreground/20 group-hover/item:scale-[1.03]"
                              style={{ backgroundColor: "var(--card)" }}
                              aria-hidden="true"
                            >
                              {it.image ? (
                                <ImageWithFallback src={it.image} alt={`${it.name} logo`} fallbackQuery={it.name} />
                              ) : (
                                <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold">
                                  {initials(it.name)}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className={`text-xs md:text-sm ${subTextToken} text-center`}>{it.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
