"use client"

import { Reveal } from "./reveal"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Github, Twitter, Globe } from "lucide-react"

const team = [
  {
    name: "Parth Mittal",
    description: "10x Hackathon 🏆 | ETHIndia'22,24 Winner | NITK'24 | PBA-5",
    img: "/parth-mittal.jpg",
    color: "bg-[#2f6f3e]", // forest green
    links: {
      portfolio: "https://example.com",
      github: "https://github.com/mittal-parth",
      twitter: "https://twitter.com/mittalparth_",
    },
  },
  {
    name: "Shubham Rasal",
    description: "Web3 & AI Hackathons Winner | ETHIndia'24 Winner | NITK'25",
    img: "/shubham-rasal.jpg",
    color: "bg-[#f47c06]", // bright orange
    links: {
      portfolio: "https://example.com",
      github: "https://github.com",
      twitter: "https://twitter.com",
    },
  },
  {
    name: "Ayush Kumar Singh",
    description: "Engineering AI in stealth, 10x hackathon winner, breaking and building things in AI and Web3",
    img: "/ayush-kumar.jpg",
    color: "bg-[#a26a87]", // muted mauve
    links: {
      github: "https://github.com",
      twitter: "https://twitter.com",
    },
  },
  {
    name: "Abhiraj Mengade",
    description: "PBA Graduate '24 | ETHIndia '22 & '24 Winner | Active contributor in the Polkadot ecosystem",
    img: "/abhiraj-mengade.jpg",
    color: "bg-[#b83a2e]", // vibrant red
    links: {
      github: "https://github.com",
      twitter: "https://twitter.com",
    },
  },
]

export function Team() {
  return (
    <section id="team" className="py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-semibold mb-12">Team</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 md:grid-cols-2 gap-6 md:gap-8">
          {team.map((member, i) => (
            <Reveal key={`${member.name}-${i}`} delay={i * 100}>
              <Card
                className={`${member.color} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden flex flex-col items-center p-6 md:p-8`}
              >
                <Avatar className="h-24 w-24 ring-4 ring-white/20 mb-4">
                  <AvatarImage src={member.img || "/placeholder.svg"} alt={`${member.name} avatar`} />
                  <AvatarFallback>
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                  <p className="text-sm text-white/80 mt-2">{member.description}</p>
                </div>

                <div className="flex gap-3 mt-auto">
                  {member.links.portfolio && (
                    <Link
                      href={member.links.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      aria-label="Portfolio"
                    >
                      <Globe className="h-4 w-4 text-white" />
                    </Link>
                  )}
                  {member.links.github && (
                    <Link
                      href={member.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      aria-label="GitHub"
                    >
                      <Github className="h-4 w-4 text-white" />
                    </Link>
                  )}
                  {member.links.twitter && (
                    <Link
                      href={member.links.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      aria-label="Twitter"
                    >
                      <Twitter className="h-4 w-4 text-white" />
                    </Link>
                  )}
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
