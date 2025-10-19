"use client"

import React, { ReactNode, useLayoutEffect, useRef, useCallback } from "react"
import Lenis from "lenis"

export interface ScrollStackItemProps {
  itemClassName?: string
  children: ReactNode
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({ children, itemClassName = "" }) => (
  <div
    className={`scroll-stack-card relative w-full h-80 my-8 p-12 rounded-[40px] shadow-[0_0_30px_rgba(0,0,0,0.1)] box-border origin-top will-change-transform ${itemClassName}`.trim()}
    style={{
      backfaceVisibility: "hidden",
      transformStyle: "preserve-3d",
    }}
  >
    {children}
  </div>
)

interface ScrollStackProps {
  className?: string
  children: ReactNode
  itemDistance?: number
  itemScale?: number
  itemStackDistance?: number
  stackPosition?: string
  scaleEndPosition?: string
  baseScale?: number
  scaleDuration?: number
  rotationAmount?: number
  blurAmount?: number
  useWindowScroll?: boolean
  onStackComplete?: () => void
}

type TransformState = {
  translateY: number
  scale: number
  rotation: number
  blur: number
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, a = -Infinity, b = Infinity) => Math.max(a, Math.min(b, v))

const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  className = "",
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = "20%",
  scaleEndPosition = "10%",
  baseScale = 0.85,
  scaleDuration = 0.5,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = false,
  onStackComplete,
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const cardsRef = useRef<HTMLElement[]>([])
  const lastTransformsRef = useRef<Map<number, TransformState>>(new Map())
  const targetTransformsRef = useRef<Map<number, TransformState>>(new Map())
  const currentTransformsRef = useRef<Map<number, TransformState>>(new Map())
  const animFrameRef = useRef<number | null>(null)
  const lenisRef = useRef<Lenis | null>(null)
  const lockedRef = useRef<Set<number>>(new Set()) // which cards are locked/sticky
  const stackCompletedRef = useRef<boolean>(false)

  const calculateProgress = useCallback((scrollTop: number, start: number, end: number) => {
    if (scrollTop < start) return 0
    if (scrollTop > end) return 1
    return (scrollTop - start) / (end - start)
  }, [])

  const parsePercentage = useCallback((value: string | number, containerHeight: number) => {
    if (typeof value === "string" && value.includes("%")) {
      return (Number.parseFloat(value) / 100) * containerHeight
    }
    return Number.parseFloat(String(value))
  }, [])

  const getScrollData = useCallback(() => {
    if (useWindowScroll) {
      return {
        scrollTop: window.scrollY || window.pageYOffset,
        containerHeight: window.innerHeight,
        scrollContainer: document.documentElement,
      }
    } else {
      const scroller = scrollerRef.current
      return {
        scrollTop: scroller ? scroller.scrollTop : 0,
        containerHeight: scroller ? scroller.clientHeight : 0,
        scrollContainer: scroller,
      }
    }
  }, [useWindowScroll])

  const getElementOffset = useCallback(
    (element: HTMLElement) => {
      if (useWindowScroll) {
        const rect = element.getBoundingClientRect()
        return rect.top + (window.scrollY || window.pageYOffset)
      } else {
        return element.offsetTop
      }
    },
    [useWindowScroll],
  )

  // compute targets and lock state
  const computeTargets = useCallback(() => {
    const cards = cardsRef.current
    if (!cards.length) return

    const { scrollTop, containerHeight } = getScrollData()
    const stackPositionPx = parsePercentage(stackPosition, containerHeight)
    const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight)

    const endElement = useWindowScroll
      ? (document.querySelector(".scroll-stack-end") as HTMLElement | null)
      : (scrollerRef.current?.querySelector(".scroll-stack-end") as HTMLElement | null)
    const endElementTop = endElement ? getElementOffset(endElement) : 0

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]
      if (!card) continue

      let translateY = 0
      let scale = 1
      let rotation = 0
      let blur = 0

      if (i === 0) {
        // first card locked/sticky BUT scaled down to match stacked size (baseScale)
        lockedRef.current.add(0)
        card.style.position = "sticky"
        card.style.top = `${stackPositionPx}px`
        // first card should be under stacked cards visually
        card.style.zIndex = "100"
        // important change: shrink first card to baseScale so it matches others
        scale = baseScale
        translateY = 0
      } else {
        const prevCard = cards[i - 1]
        const prevTop = prevCard ? getElementOffset(prevCard) : 0
        const cardTop = getElementOffset(card)
        const stackIndex = i - 1

        const triggerStart = prevTop - stackPositionPx - itemStackDistance * stackIndex
        const triggerEnd = cardTop - scaleEndPositionPx
        const pinStart = prevTop - stackPositionPx - itemStackDistance * stackIndex
        const pinEnd = endElementTop - containerHeight / 2

        const shouldLock = scrollTop >= pinStart

        if (shouldLock) {
          lockedRef.current.add(i)
          card.style.position = "sticky"
          card.style.top = `${stackPositionPx}px`
          card.style.zIndex = String(200 + i)
          const targetScale = baseScale + stackIndex * itemScale
          scale = targetScale
          translateY = 0
          rotation = 0
          if (blurAmount) {
            const depthInStack = stackIndex
            blur = clamp(depthInStack * blurAmount * 0.25, 0, 6)
          }
        } else {
          lockedRef.current.delete(i)
          card.style.position = ""
          const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd)
          const targetScale = baseScale + stackIndex * itemScale
          scale = 1 - scaleProgress * (1 - targetScale)
          rotation = rotationAmount ? stackIndex * rotationAmount * scaleProgress : 0

          if (blurAmount) {
            let topStackIndex = 0
            for (let j = 1; j < cards.length; j++) {
              const pj = cards[j - 1]
              const pjTop = pj ? getElementOffset(pj) : 0
              const jTriggerStart = pjTop - stackPositionPx - itemStackDistance * (j - 1)
              if (scrollTop >= jTriggerStart) topStackIndex = j
            }
            if (i < topStackIndex) {
              const depthInStack = topStackIndex - i
              blur = clamp(depthInStack * blurAmount * 0.35, 0, 6)
            }
          }

          const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd
          if (isPinned) {
            translateY = prevTop - cardTop + stackPositionPx + itemStackDistance * stackIndex
          } else if (scrollTop > pinEnd) {
            translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * stackIndex
          } else {
            translateY = 0
          }

          card.style.zIndex = String(200 + i)
        }
      }

      const target: TransformState = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100,
      }

      targetTransformsRef.current.set(i, target)

      if (i === cards.length - 1) {
        const prevTop = cards.length > 1 ? getElementOffset(cards[i - 1]) : getElementOffset(cards[i])
        const pinStart = prevTop - stackPositionPx - itemStackDistance * (i - 1)
        const pinEnd = endElementTop - containerHeight / 2
        const isInView = getScrollData().scrollTop >= pinStart && getScrollData().scrollTop <= pinEnd
        if (isInView && !stackCompletedRef.current) {
          stackCompletedRef.current = true
          onStackComplete?.()
        } else if (!isInView && stackCompletedRef.current) {
          stackCompletedRef.current = false
        }
      }
    }
  }, [
    baseScale,
    blurAmount,
    calculateProgress,
    getElementOffset,
    getScrollData,
    itemScale,
    itemStackDistance,
    rotationAmount,
    scaleEndPosition,
    stackPosition,
    onStackComplete,
    useWindowScroll,
  ])

  // animation loop: lerp current -> target and apply styles
  const animateLoop = useCallback(() => {
    const cards = cardsRef.current
    if (!cards.length) {
      animFrameRef.current = requestAnimationFrame(animateLoop)
      return
    }

    const targets = targetTransformsRef.current
    const current = currentTransformsRef.current
    const last = lastTransformsRef.current
    const t = 0.12

    for (let i = 0; i < cards.length; i++) {
      const el = cards[i]
      const target = targets.get(i) ?? { translateY: 0, scale: 1, rotation: 0, blur: 0 }
      const curr = current.get(i) ?? { translateY: target.translateY, scale: target.scale, rotation: target.rotation, blur: target.blur }

      const isLocked = lockedRef.current.has(i)

      const next: TransformState = isLocked
        ? {
            translateY: 0,
            scale: Math.abs(target.scale - curr.scale) < 0.0005 ? target.scale : lerp(curr.scale, target.scale, t),
            rotation: 0,
            blur: Math.abs(target.blur - curr.blur) < 0.02 ? target.blur : lerp(curr.blur, target.blur, t),
          }
        : {
            translateY: Math.abs(target.translateY - curr.translateY) < 0.02 ? target.translateY : lerp(curr.translateY, target.translateY, t),
            scale: Math.abs(target.scale - curr.scale) < 0.0005 ? target.scale : lerp(curr.scale, target.scale, t),
            rotation: Math.abs(target.rotation - curr.rotation) < 0.02 ? target.rotation : lerp(curr.rotation, target.rotation, t),
            blur: Math.abs(target.blur - curr.blur) < 0.02 ? target.blur : lerp(curr.blur, target.blur, t),
          }

      const lastApplied = last.get(i)
      const changed =
        !lastApplied ||
        Math.abs(lastApplied.translateY - next.translateY) > 0.05 ||
        Math.abs(lastApplied.scale - next.scale) > 0.0008 ||
        Math.abs(lastApplied.rotation - next.rotation) > 0.05 ||
        Math.abs(lastApplied.blur - next.blur) > 0.05

      if (changed) {
        const transform = isLocked
          ? `translate3d(0, 0px, 0) scale(${Math.round(next.scale * 10000) / 10000}) rotate(${Math.round(next.rotation * 100) / 100}deg)`
          : `translate3d(0, ${Math.round(next.translateY * 100) / 100}px, 0) scale(${Math.round(next.scale * 10000) / 10000}) rotate(${Math.round(next.rotation * 100) / 100}deg)`

        const filter = next.blur > 0.01 ? `blur(${Math.round(next.blur * 100) / 100}px)` : ""

        el.style.transform = transform
        el.style.webkitTransform = transform
        el.style.filter = filter
        el.style.zIndex = String(200 + i)

        last.set(i, next)
      }

      current.set(i, next)
    }

    animFrameRef.current = requestAnimationFrame(animateLoop)
  }, [])

  const updateTargetsAndCompute = useCallback(() => {
    computeTargets()
    if (animFrameRef.current == null) animFrameRef.current = requestAnimationFrame(animateLoop)
  }, [computeTargets, animateLoop])

  const handleScrollEvent = useCallback(() => {
    updateTargetsAndCompute()
  }, [updateTargetsAndCompute])

  // start Lenis and ensure RAF loop for Lenis so scrolling works
  const setupLenis = useCallback(() => {
    if (useWindowScroll) {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
        infinite: false,
        wheelMultiplier: 1,
        lerp: 0.1,
        syncTouch: true,
        syncTouchLerp: 0.075,
      })

      lenis.on("scroll", handleScrollEvent)

      const raf = (time: number) => {
        lenis.raf(time)
        animFrameRef.current = requestAnimationFrame(raf)
      }
      animFrameRef.current = requestAnimationFrame(raf)

      lenisRef.current = lenis
      return lenis
    } else {
      const scroller = scrollerRef.current
      if (!scroller) return

      const lenis = new Lenis({
        wrapper: scroller,
        content: scroller.querySelector(".scroll-stack-inner") as HTMLElement,
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
        infinite: false,
        gestureOrientation: "vertical",
        wheelMultiplier: 1,
        lerp: 0.1,
        syncTouch: true,
        syncTouchLerp: 0.075,
      })

      lenis.on("scroll", handleScrollEvent)

      const raf = (time: number) => {
        lenis.raf(time)
        animFrameRef.current = requestAnimationFrame(raf)
      }
      animFrameRef.current = requestAnimationFrame(raf)

      lenisRef.current = lenis
      return lenis
    }
  }, [handleScrollEvent, useWindowScroll])

  useLayoutEffect(() => {
    if (!useWindowScroll && !scrollerRef.current) return

    const cards = Array.from(
      useWindowScroll
        ? (document.querySelectorAll(".scroll-stack-card") as NodeListOf<HTMLElement>)
        : ((scrollerRef.current?.querySelectorAll(".scroll-stack-card") as NodeListOf<HTMLElement>) ?? [])
    )
    cardsRef.current = cards
    lastTransformsRef.current.clear()
    targetTransformsRef.current.clear()
    currentTransformsRef.current.clear()
    lockedRef.current.clear()
    stackCompletedRef.current = false

    const containerHeight = getScrollData().containerHeight
    const stackPositionPx = parsePercentage(stackPosition, containerHeight)

    cards.forEach((card, i) => {
      if (i < cards.length - 1) card.style.marginBottom = `${itemDistance}px`
      card.style.willChange = "transform, filter"
      card.style.transformOrigin = "top center"
      card.style.backfaceVisibility = "hidden"
      card.style.transform = "translateZ(0)"
      card.style.webkitTransform = "translateZ(0)"
      card.style.perspective = "1000px"
      card.style.webkitPerspective = "1000px"

      if (i === 0) {
        // first card initial sticky with LOWER z-index (so stacked cards show above it)
        card.style.position = "sticky"
        card.style.top = `${stackPositionPx}px`
        card.style.zIndex = "100"
      } else {
        card.style.position = ""
        card.style.zIndex = String(200 + i)
      }
    })

    // start our transform animation loop
    if (animFrameRef.current == null) animFrameRef.current = requestAnimationFrame(animateLoop)

    setupLenis()
    computeTargets()

    const onResize = () => computeTargets()
    window.addEventListener("resize", onResize)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      if (lenisRef.current) {
        lenisRef.current.destroy()
        lenisRef.current = null
      }
      window.removeEventListener("resize", onResize)
      cardsRef.current = []
      lastTransformsRef.current.clear()
      targetTransformsRef.current.clear()
      currentTransformsRef.current.clear()
      lockedRef.current.clear()
      stackCompletedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    itemDistance,
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    scaleDuration,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    setupLenis,
    computeTargets,
  ])

  const containerStyle = useWindowScroll
    ? {
        overscrollBehavior: "contain" as const,
        WebkitOverflowScrolling: "touch" as const,
        scrollBehavior: "smooth" as const,
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
        willChange: "scroll-position" as const,
        overflowY: "visible" as const,
        height: "auto" as const,
      }
    : {
        overscrollBehavior: "contain" as const,
        WebkitOverflowScrolling: "touch" as const,
        scrollBehavior: "smooth" as const,
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
        willChange: "scroll-position" as const,
        overflowY: "auto" as const,
        height: "100%",
      }

  return (
    <div
      className={`relative w-full h-full overflow-x-visible ${className}`.trim()}
      ref={scrollerRef}
      style={containerStyle}
    >
      <div className="scroll-stack-inner pt-[20vh] px-20 pb-[50rem] min-h-screen">
        {children}
        <div className="scroll-stack-end w-full h-px" />
      </div>
    </div>
  )
}

export default ScrollStack
