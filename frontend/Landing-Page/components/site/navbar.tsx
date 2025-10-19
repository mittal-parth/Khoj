"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const [open, setOpen] = useState(false)
  const linkClass = "text-sm md:text-base text-foreground/80 hover:text-foreground transition-colors"

  return (
    <header className="sticky top-0 z-50 bg-[color:var(--surface-white)] border-b-2 border-black">
      <nav className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link href="#top" className="inline-flex items-center gap-0 hover:opacity-90" aria-label="Khoj home">
            <img src="/images/khoj-logo-no-bg.png" alt="Khoj logo" className="h-14 md:h-16 w-auto" />
          </Link>

          <button
            className="md:hidden p-2 rounded-md hover:bg-muted focus:outline-none focus-visible:ring"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Open menu</span>
            <div className="space-y-1">
              <span className="block h-0.5 w-5 bg-foreground"></span>
              <span className="block h-0.5 w-5 bg-foreground"></span>
              <span className="block h-0.5 w-5 bg-foreground"></span>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className={linkClass}>
              Features
            </Link>
            <Link href="#use-cases" className={linkClass}>
              Use cases
            </Link>
            <Link href="#tech" className={linkClass}>
              Tech
            </Link>
            <Link href="#team" className={linkClass}>
              Team
            </Link>
            <Button className="transition-transform hover:-translate-y-0.5" asChild>
              <a href="https://playkhoj.com">Get Started</a>
            </Button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-3">
              <a onClick={() => setOpen(false)} href="#features" className={linkClass}>
                Features
              </a>
              <a onClick={() => setOpen(false)} href="#use-cases" className={linkClass}>
                Use cases
              </a>
              <a onClick={() => setOpen(false)} href="#tech" className={linkClass}>
                Tech
              </a>
              <a onClick={() => setOpen(false)} href="#team" className={linkClass}>
                Team
              </a>
              <Button onClick={() => setOpen(false)} className="self-start" asChild>
                <a href="https://playkhoj.com">Get Started</a>
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
