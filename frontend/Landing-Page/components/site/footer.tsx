export function SiteFooter() {
  return (
    <footer className="border-t-2 border-black bg-[color:var(--surface-white)]">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Logo + Tagline */}
          <div>
            <a href="#top" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/images/khoj-logo-no-bg.png" alt="Khoj logo" className="h-25 md:h-28 w-auto" />
              <span className="sr-only">Khoj home</span>
            </a>
            <p className="text-sm text-foreground/70 mt-3">Bringing real world exploration on-chain</p>
          </div>

          {/* Explore (anchors) */}
          <div>
            <div className="font-medium mb-3">Explore</div>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="hover:underline">
                  Features
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:underline">
                  Use cases
                </a>
              </li>
              <li>
                <a href="#tech" className="hover:underline">
                  Tech
                </a>
              </li>
              <li>
                <a href="#team" className="hover:underline">
                  Team
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <div className="font-medium mb-3">Resources</div>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/mittal-parth/Khoj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/mittal-parth/Khoj/wiki/Product-Guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Product Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Highlights */}
          <div>
            <div className="font-medium mb-3">Highlights</div>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://x.com/mittalparth_/status/1866148021903507694"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  ETHIndia’24 Finalist Project
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Polkadot-Fast-Grants/apply/pull/61"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Backed by Polkadot Fast Grants
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-xs text-foreground/60 mt-8">© {new Date().getFullYear()} Khoj — All rights reserved.</p>
      </div>
    </footer>
  )
}
