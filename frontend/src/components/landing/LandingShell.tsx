import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BookOpen, Github, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { KhojLogo } from '@/components/landing/KhojLogo';
import { FOOTER_LINKS } from '@/components/landing/journey';

const LINK_ICONS = {
  Docs: BookOpen,
  GitHub: Github,
  Deck: Presentation,
} as const;

interface LandingNavProps {
  onLaunch: () => void;
  links?: { id: string; label: string }[];
  onScrollTo?: (id: string) => void;
}

export function LandingNav({
  onLaunch,
  links = [],
  onScrollTo,
}: LandingNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNav = (id: string) => {
    if (onScrollTo) {
      if (drawerOpen) {
        setDrawerOpen(false);
        setTimeout(() => onScrollTo(id), 300);
      } else {
        onScrollTo(id);
      }
    }
  };

  return (
    <header className="fixed top-3 left-3 right-3 z-50 md:top-4 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-[min(100%,56rem)]">
      {/* Mobile — menu only, top-right */}
      <nav className="md:hidden flex justify-end">
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="w-10 h-10 rounded-full border-2 border-border bg-background/95 backdrop-blur-sm shadow-shadow flex flex-col items-center justify-center gap-[3px] shrink-0 text-foreground/75 hover:text-foreground hover:bg-background active:translate-y-px transition-[color,background,transform] duration-150"
              aria-label="Open menu"
            >
              <span className="block w-4 h-[2px] rounded-full bg-current" />
              <span className="block w-4 h-[2px] rounded-full bg-current" />
              <span className="block w-4 h-[2px] rounded-full bg-current" />
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="p-4 flex flex-col gap-3">
              {links.map((link) => (
                <DrawerClose key={link.id} asChild>
                  <Button variant="ghost" onClick={() => handleNav(link.id)}>
                    {link.label}
                  </Button>
                </DrawerClose>
              ))}
              <DrawerClose asChild>
                <Button onClick={onLaunch}>Launch App</Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </nav>

      {/* Desktop — full pill nav */}
      <nav className="hidden md:flex bg-background/95 backdrop-blur-sm border-2 border-border rounded-full shadow-shadow px-5 py-2 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onScrollTo?.('hero')}
          className="shrink-0 flex items-center"
          aria-label="Khoj home"
        >
          <KhojLogo size="sm" />
        </button>

        <div className="hidden md:flex items-center gap-4">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => handleNav(link.id)}
              className="text-sm font-medium hover:text-chart-3 transition-colors uppercase tracking-wide"
            >
              {link.label}
            </button>
          ))}
        </div>

        <Button size="sm" onClick={onLaunch}>
          Launch App
        </Button>
      </nav>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-ink text-white pt-12 px-4 pb-[max(3rem,env(safe-area-inset-bottom,0px))] border-t-4 border-border overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
            <KhojLogo size="md" className="mb-3" />
            <p className="text-white/60 text-sm max-w-xs leading-relaxed">
              Geo-location treasure hunts that turn Web3 onboarding into an adventure.
            </p>
          </div>

          <nav
            className="flex flex-row flex-nowrap items-center justify-center md:justify-end gap-6 md:gap-8 shrink-0"
            aria-label="Resources"
          >
            {FOOTER_LINKS.map((link) => {
              const Icon = LINK_ICONS[link.label as keyof typeof LINK_ICONS];
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm leading-none text-white/55 hover:text-white transition-colors whitespace-nowrap"
                >
                  {Icon && (
                    <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden>
                      <Icon className="size-3.5 opacity-60" strokeWidth={2} />
                    </span>
                  )}
                  <span>{link.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        <p className="text-center text-white/35 text-xs border-t border-white/10 pt-8">
          © {new Date().getFullYear()} Khoj. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

interface LandingCtaProps {
  onLaunch: () => void;
}

export function LandingCta({ onLaunch }: LandingCtaProps) {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative py-24 md:py-32 px-4 bg-chart-2 border-t-4 border-border overflow-hidden">
      <motion.div
        className="relative max-w-3xl mx-auto text-center"
        initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: reducedMotion ? 0.15 : 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <KhojLogo size="xl" className="mx-auto mb-8" />
        <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-heading text-white leading-tight">
          The trail ends in reward.
        </h2>
        <p className="mt-4 text-lg text-white/85">
          Real places. Real clues. Onchain rewards waiting at the finish line.
        </p>
        <Button size="lg" variant="neutral" onClick={onLaunch} className="mt-8 text-base px-8">
          Start Exploring
          <ArrowRight className="w-5 h-5" />
        </Button>
      </motion.div>
    </section>
  );
}
