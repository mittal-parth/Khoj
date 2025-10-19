import { cn } from "@/lib/utils"

type UseCaseCardProps = {
  title: string
  description: string
  colorVar: "--khoj-green" | "--khoj-orange" | "--khoj-gold" | "--khoj-mauve" | "--khoj-red"
  className?: string
}

export function UseCaseCard({ title, description, colorVar, className }: UseCaseCardProps) {
  return (
    <article
      className={cn(
        "usecase-card usecase-compact transition-transform duration-200",
        "rounded-xl overflow-hidden",
        className,
      )}
      style={{
        backgroundColor: `var(${colorVar})`,
      }}
      aria-label={title}
    >
      <h3 className="text-base font-semibold leading-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 opacity-95">{description}</p>
    </article>
  )
}
