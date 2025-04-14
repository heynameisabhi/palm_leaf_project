"use client";

import { motion, useScroll } from "framer-motion";
import ContributorsSection from "@/components/landing/ContributorsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import Footer from "@/components/landing/Footer";
import HeroSection from "@/components/landing/HeroSection";

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/30 via-emerald-500/70 to-green-500/30 z-[100] transform-origin-0"
      style={{ scaleX: scrollYProgress }}
    />
  );
};

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black">
      <ScrollProgress />
      
      {/* Fixed Background Elements */}
      <div className="fixed inset-0 z-0">
        {/* Base grid pattern */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem]"
          style={{
            maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 70%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 70%, transparent 100%)'
          }}
        />

        {/* Ambient glow effects */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <HeroSection />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/80 to-black" />
          <FeaturesSection />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black" />
          <ContributorsSection />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative bg-black/90 backdrop-blur-sm"
        >
          <Footer />
        </motion.div>
      </motion.div>

      {/* Radial gradient overlay for depth */}
      <div className="fixed inset-0 pointer-events-none z-[1] bg-gradient-radial from-transparent via-black/20 to-black/50" />
    </main>
  );
}
