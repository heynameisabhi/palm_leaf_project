"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Leaf, Github, Twitter, Mail, Heart } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }

    const ctx = gsap.context(() => {
      gsap.from(footerRef.current, {
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top bottom",
          toggleActions: "play none none none",
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="bg-zinc-950 border-t border-zinc-800 pt-16 pb-8 relative overflow-hidden"
    >
      {/* Gradient orb */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-gradient-to-r from-emerald-900/10 to-green-800/10 blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-green-600 shadow-md">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl text-transparent bg-clip-text bg-gradient-to-tr from-gray-600 to-white font-bold tracking-widest">
                VEDA
              </span>
            </Link>
            <p className="text-zinc-400 mb-4">
              Preserving ancient knowledge through advanced OCR technology.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-zinc-800 hover:bg-emerald-800 transition-colors"
              >
                <Github className="h-5 w-5 text-white" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-zinc-800 hover:bg-emerald-800 transition-colors"
              >
                <Twitter className="h-5 w-5 text-white" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                href="mailto:info@palmleaf.org"
                className="p-2 rounded-full bg-zinc-800 hover:bg-emerald-800 transition-colors"
              >
                <Mail className="h-5 w-5 text-white" />
                <span className="sr-only">Email</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Project</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-zinc-400 hover:text-emerald-500 transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/features"
                  className="text-zinc-400 hover:text-emerald-500 transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/research"
                  className="text-zinc-400 hover:text-emerald-500 transition-colors"
                >
                  Research
                </Link>
              </li>
              <li>
                <Link
                  href="/roadmap"
                  className="text-zinc-400 hover:text-emerald-500 transition-colors"
                >
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/documentation"
                  className="text-zinc-400 hover:text-emerald-500 transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/api"
                  className="text-zinc-400 hover:text-emerald-500 transition-colors"
                >
                  API
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-zinc-400 hover:text-emerald-500 transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-zinc-400 hover:text-emerald-500 transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-zinc-400 hover:text-emerald-500 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-zinc-400 hover:text-emerald-500 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-zinc-400 hover:text-emerald-500 transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/licenses"
                  className="text-zinc-400 hover:text-emerald-500 transition-colors"
                >
                  Licenses
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <p className="text-zinc-500 flex items-center justify-center gap-1">
            © {new Date().getFullYear()} Palm Leaf Transcription Project. Made
            with
            <Heart className="h-4 w-4 text-emerald-500" /> by our contributors.
          </p>
        </div>
      </div>
    </footer>
  );
}
