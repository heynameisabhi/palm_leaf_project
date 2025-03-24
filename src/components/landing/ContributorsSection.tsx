"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Github, Twitter, Linkedin } from "lucide-react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

interface ContributorCardProps {
  name: string
  role: string
  imagePath: string
  index: number
  socialLinks: {
    github?: string
    twitter?: string
    linkedin?: string
  }
}

function ContributorCard({ name, role, imagePath, index, socialLinks }: ContributorCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger)
    }

    gsap.from(cardRef.current, {
      scrollTrigger: {
        trigger: cardRef.current,
        start: "top bottom-=100",
        toggleActions: "play none none none",
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      delay: index * 0.1,
      ease: "power3.out",
    })
  }, [index])

  return (
    <div
      ref={cardRef}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm hover:border-emerald-900/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/10 group"
    >
      <div className="h-48 relative overflow-hidden">
        <Image
          src={imagePath || "/placeholder.svg"}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-60"></div>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-semibold text-white">{name}</h3>
        <p className="text-emerald-500 mb-3">{role}</p>

        <div className="flex gap-3">
          {socialLinks.github && (
            <Link
              href={socialLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-zinc-800 hover:bg-emerald-800 transition-colors"
            >
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </Link>
          )}
          {socialLinks.twitter && (
            <Link
              href={socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-zinc-800 hover:bg-emerald-800 transition-colors"
            >
              <Twitter className="h-4 w-4" />
              <span className="sr-only">Twitter</span>
            </Link>
          )}
          {socialLinks.linkedin && (
            <Link
              href={socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-zinc-800 hover:bg-emerald-800 transition-colors"
            >
              <Linkedin className="h-4 w-4" />
              <span className="sr-only">LinkedIn</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ContributorsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger)
    }

    const ctx = gsap.context(() => {
      gsap.from(headingRef.current, {
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top bottom-=100",
          toggleActions: "play none none none",
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const contributors = [
    {
      name: "Dr. Aisha Patel",
      role: "Lead Researcher",
      imagePath: "/placeholder.svg?height=400&width=300",
      socialLinks: {
        github: "https://github.com",
        twitter: "https://twitter.com",
        linkedin: "https://linkedin.com",
      },
    },
    {
      name: "Prof. Michael Chen",
      role: "OCR Specialist",
      imagePath: "/placeholder.svg?height=400&width=300",
      socialLinks: {
        github: "https://github.com",
        linkedin: "https://linkedin.com",
      },
    },
    {
      name: "Dr. Sarah Johnson",
      role: "Historical Linguist",
      imagePath: "/placeholder.svg?height=400&width=300",
      socialLinks: {
        twitter: "https://twitter.com",
        linkedin: "https://linkedin.com",
      },
    },
    {
      name: "Raj Mehta",
      role: "AI Engineer",
      imagePath: "/placeholder.svg?height=400&width=300",
      socialLinks: {
        github: "https://github.com",
        twitter: "https://twitter.com",
      },
    },
  ]

  return (
    <section ref={sectionRef} className="py-20 relative overflow-x-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-1/3 -left-20 w-[250px] h-[250px] rounded-full bg-gradient-to-r from-emerald-900/10 to-green-800/10 blur-3xl"></div>
      <div className="absolute bottom-1/3 -right-20 w-[300px] h-[300px] rounded-full bg-gradient-to-r from-green-900/10 to-emerald-800/10 blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div ref={headingRef} className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Meet Our{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-400">
              Contributors
            </span>
          </h2>
          <p className="text-zinc-400 text-lg">
            Our diverse team of experts combines knowledge in linguistics, computer science, and historical preservation
            to make this project possible.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {contributors.map((contributor, index) => (
            <ContributorCard
              key={index}
              name={contributor.name}
              role={contributor.role}
              imagePath={contributor.imagePath}
              socialLinks={contributor.socialLinks}
              index={index}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/join-us"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
          >
            <Github className="h-5 w-5" />
            Become a Contributor
          </Link>
        </div>
      </div>
    </section>
  )
}

