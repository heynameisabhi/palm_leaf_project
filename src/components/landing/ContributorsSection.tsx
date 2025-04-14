"use client"

import { motion } from "framer-motion"
import { Database, Code, Cpu } from "lucide-react"

interface TeamSectionProps {
  title: string
  icon: React.ReactNode
  members: Array<{
    name: string
    role: string
  }>
}

function TeamSection({ title, icon, members }: TeamSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {members.map((member, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="relative group"
          >
            <div className="bg-black/20 border border-zinc-800 rounded-lg p-4 hover:border-emerald-500/30 transition-all duration-300">
              <h4 className="text-white/80 font-medium">Name {index + 1}</h4>
              <p className="text-emerald-500 text-sm">{member.role}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default function ContributorsSection() {
  const teams = [
    {
      title: "Web Application Development Team",
      icon: <Code className="h-5 w-5" />,
      members: [
        { name: "Name 1", role: "Frontend Developer" },
        { name: "Name 2", role: "Backend Developer" },
        { name: "Name 3", role: "Full Stack Developer" },
      ],
    },
    {
      title: "OCR Team",
      icon: <Cpu className="h-5 w-5" />,
      members: [
        { name: "Name 1", role: "OCR Specialist" },
        { name: "Name 2", role: "Machine Learning Engineer" },
        { name: "Name 3", role: "Computer Vision Engineer" },
      ],
    },
    {
      title: "Database Design Team",
      icon: <Database className="h-5 w-5" />,
      members: [
        { name: "Name 1", role: "Database Architect" },
        { name: "Name 2", role: "Data Engineer" },
        { name: "Name 3", role: "Database Administrator" },
      ],
    },
  ]

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#0f4c3f20,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#0f4c3f20,transparent_50%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Our{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
              Contributors
            </span>
          </h2>
          <p className="text-zinc-400 text-lg">
            Meet the dedicated contributors behind PalmLeaf Project, working together to preserve and digitize ancient manuscripts.
          </p>
        </motion.div>

        <div className="space-y-8">
          {teams.map((team, index) => (
            <TeamSection
              key={index}
              title={team.title}
              icon={team.icon}
              members={team.members}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

