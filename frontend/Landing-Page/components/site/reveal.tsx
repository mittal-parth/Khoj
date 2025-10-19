"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  as?: any
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        "opacity-0 translate-y-6",
        visible && "opacity-100 translate-y-0",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}
