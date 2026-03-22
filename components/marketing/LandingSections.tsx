'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { scrollReveal, scrollRevealViewport, fadeUp, staggerContainer } from '@/lib/motion'
import { Anchor, Users, Ship, Award, Clock, ArrowRight } from 'lucide-react'

interface LandingSectionsProps {
  crewCount: number
}

function Section({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.section
      variants={scrollReveal}
      initial="hidden"
      whileInView="visible"
      viewport={scrollRevealViewport}
      className={className}
    >
      {children}
    </motion.section>
  )
}

export function LandingSections({ crewCount }: LandingSectionsProps) {
  return (
    <main>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[var(--color-teal-50)] to-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            <motion.h1
              variants={fadeUp}
              className="font-[family-name:var(--font-dm-serif-display)] text-4xl md:text-5xl lg:text-6xl text-[var(--color-text-primary)] leading-[1.15] tracking-tight"
            >
              Your career on the water, in one place.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-5 text-lg md:text-xl text-[var(--color-text-secondary)] max-w-lg"
            >
              A portable professional identity built on real yacht history and trusted endorsements from crew you&apos;ve actually worked with.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/welcome"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[var(--color-interactive)] text-white font-medium text-base hover:bg-[var(--color-interactive-hover)] transition-colors"
              >
                Get started — it&apos;s free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            {crewCount > 100 && (
              <motion.p variants={fadeUp} className="mt-4 text-sm text-[var(--color-text-tertiary)]">
                {crewCount.toLocaleString()} crew have joined YachtieLink
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <Section className="py-16 md:py-24 bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-dm-serif-display)] text-2xl md:text-3xl text-[var(--color-text-primary)] text-center mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                icon: <Anchor className="w-6 h-6" />,
                title: 'Build your profile',
                description:
                  'Import your CV or add yachts manually. Your employment history becomes the foundation of your professional identity.',
              },
              {
                icon: <Ship className="w-6 h-6" />,
                title: 'Connect through yachts',
                description:
                  'Attach to yachts you\u2019ve worked on. Discover who else was on board. Every yacht is a node in your network.',
              },
              {
                icon: <Award className="w-6 h-6" />,
                title: 'Earn trusted endorsements',
                description:
                  'Colleagues who shared the yacht can endorse your work. Real people, real boats, real trust.',
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={scrollRevealViewport}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-teal-50)] text-[var(--color-interactive)] flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── What Makes It Different ── */}
      <Section className="py-16 md:py-24 bg-[var(--color-sand-50,#faf8f5)]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-dm-serif-display)] text-2xl md:text-3xl text-[var(--color-text-primary)] text-center mb-12">
            Built for yacht crew
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: <Users className="w-5 h-5" />,
                title: 'Portable identity',
                description:
                  'Your profile goes where you go. One link that represents your career — share it with captains, agencies, or crew.',
              },
              {
                icon: <Ship className="w-5 h-5" />,
                title: 'The yacht graph',
                description:
                  'See everyone you\u2019ve worked with, grouped by yacht. Click through profiles and yachts to explore your network.',
              },
              {
                icon: <Award className="w-5 h-5" />,
                title: 'Trusted endorsements',
                description:
                  'Only crew who shared a yacht can endorse you. No strangers, no bought reviews — just real coworkers.',
              },
              {
                icon: <Clock className="w-5 h-5" />,
                title: 'Sea time tracking',
                description:
                  'Know exactly how long you\u2019ve been at sea. Per-yacht breakdown with roles and dates, calculated automatically.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={scrollRevealViewport}
                className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--color-teal-50)] text-[var(--color-interactive)] flex items-center justify-center mb-3">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA ── */}
      <Section className="py-16 md:py-24 bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="font-[family-name:var(--font-dm-serif-display)] text-2xl md:text-3xl text-[var(--color-text-primary)] mb-4">
            Ready to get started?
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto">
            Join crew from yachts worldwide. Build your profile, connect with colleagues, and own your professional identity.
          </p>
          <Link
            href="/welcome"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[var(--color-interactive)] text-white font-medium text-base hover:bg-[var(--color-interactive-hover)] transition-colors"
          >
            Create your profile — free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Section>

      {/* ── Sticky mobile CTA ── */}
      <div className="fixed bottom-[env(safe-area-inset-bottom,0px)] left-0 right-0 p-3 bg-[var(--color-surface)]/95 backdrop-blur-sm border-t border-[var(--color-border)] z-30 md:hidden">
        <Link
          href="/welcome"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[var(--color-interactive)] text-white font-medium text-sm hover:bg-[var(--color-interactive-hover)] transition-colors"
        >
          Get started — it&apos;s free
        </Link>
      </div>
    </main>
  )
}
