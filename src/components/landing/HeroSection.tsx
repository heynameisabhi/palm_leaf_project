"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight, Leaf } from "lucide-react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger)
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      tl.from(headingRef.current, {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      })
        .from(
          textRef.current,
          {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.4",
        )
        .from(
          ctaRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
          },
          "-=0.2",
        )
        .from(
          ".gradient-orb",
          {
            scale: 0,
            opacity: 0,
            duration: 1.5,
            stagger: 0.2,
            ease: "elastic.out(1, 0.3)",
          },
          "-=0.8",
        )

      // Floating animation for orbs
      gsap.to(".gradient-orb", {
        y: "random(-20, 20)",
        x: "random(-20, 20)",
        duration: "random(3, 6)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.2,
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative pt-32 pb-20 overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-20 w-[300px] h-[300px] rounded-full bg-gradient-to-r from-emerald-900/20 to-green-800/20 blur-3xl gradient-orb"></div>
      <div className="absolute bottom-1/4 -right-20 w-[250px] h-[250px] rounded-full bg-gradient-to-r from-green-900/20 to-emerald-800/20 blur-3xl gradient-orb"></div>
      <div className="absolute top-3/4 left-1/3 w-[200px] h-[200px] rounded-full bg-gradient-to-r from-emerald-800/10 to-green-700/10 blur-3xl gradient-orb"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-green-600 shadow-lg">
              <Leaf className="h-8 w-8 text-white" />
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-emerald-500 to-green-400 opacity-50 blur-md"></div>
            </div>
          </div>

          <h1 ref={headingRef} className="text-4xl text-white md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Palm Leaf{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-400">
              Transcription
            </span>{" "}
            Project
          </h1>

          <p ref={textRef} className="text-lg md:text-xl text-zinc-300 mb-8 max-w-3xl mx-auto">
            Preserving ancient knowledge through advanced OCR technology. Our cutting-edge platform digitizes and
            transcribes historical palm leaf manuscripts, making centuries of wisdom accessible to the world.
          </p>

          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-in"
              className="px-8 py-4 rounded-md bg-gradient-to-r from-emerald-800 to-green-700 hover:from-emerald-900 hover:to-green-800 text-white font-medium shadow-lg transition-all hover:shadow-emerald-900/20 hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              Get Started
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white font-medium shadow-md transition-all flex items-center justify-center"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

