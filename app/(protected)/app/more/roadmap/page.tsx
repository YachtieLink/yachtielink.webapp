'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronUp, Plus, Clock, Rocket, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageTransition } from '@/components/ui/PageTransition'
import { staggerContainer, fadeUp } from '@/lib/motion'
import { useToast } from '@/components/ui/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'roadmap' | 'requests' | 'released'
type SortMode = 'votes' | 'newest'

interface FeatureSuggestion {
  id: string
  title: string
  description: string | null
  category: string | null
  status: string
  vote_count: number
  created_at: string
}

// ─── Roadmap Data ─────────────────────────────────────────────────────────────

type RoadmapStage = 'in_progress' | 'next' | 'later'

interface RoadmapItem {
  title: string
  description: string
  stage: RoadmapStage
  category: string
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    title: 'Endorsement writing assist',
    description: 'Get help drafting endorsements that capture what makes someone great to work with.',
    stage: 'in_progress',
    category: 'Endorsements',
  },
  {
    title: 'Smart cert matching',
    description: 'Automatically match your certifications against flag state and vessel requirements.',
    stage: 'in_progress',
    category: 'CV',
  },
  {
    title: 'Network redesign',
    description: 'A completely rethought network experience — find crew faster, see mutual connections, explore the yacht graph.',
    stage: 'in_progress',
    category: 'Network',
  },
  {
    title: 'Crew search — Pro',
    description: 'Search all crew by role, department, yacht history, and availability. Built for captains and heads of department.',
    stage: 'next',
    category: 'Search',
  },
  {
    title: 'Direct messaging',
    description: 'Message crew you\'ve worked with or connected through the yacht graph. No spam — real connections only.',
    stage: 'next',
    category: 'Messaging',
  },
  {
    title: 'Yacht reviews',
    description: 'Anonymous, verified reviews from crew who actually worked on board. Finally, honest intel before you sign on.',
    stage: 'later',
    category: 'Network',
  },
  {
    title: 'Profile enhancement',
    description: 'Smart suggestions to strengthen your profile based on what captains and agents actually look for.',
    stage: 'later',
    category: 'Profile',
  },
]

const RELEASED_ITEMS = [
  {
    title: 'Sea time calculator',
    description: 'Track total time at sea with a per-yacht breakdown — roles, dates, and days calculated automatically.',
    category: 'Profile',
  },
  {
    title: 'PDF resume snapshot',
    description: 'Generate a professionally formatted PDF of your YachtieLink profile at any time.',
    category: 'CV & Employment',
  },
  {
    title: 'Profile analytics dashboard',
    description: 'See who viewed your profile, when, and how they found you.',
    category: 'Analytics',
  },
  {
    title: 'Colleague network explorer',
    description: 'Browse everyone you\'ve worked with, grouped by yacht, with endorsement status and quick actions.',
    category: 'Networking',
  },
  {
    title: 'Dynamic OG images',
    description: 'When you share your profile link on WhatsApp or social media, a rich preview card generates automatically.',
    category: 'Profile',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<RoadmapStage, { label: string; icon: typeof Zap; className: string; iconClassName: string }> = {
  in_progress: {
    label: 'In Progress',
    icon: Zap,
    className: 'bg-[var(--color-teal-50)] text-[var(--color-interactive)]',
    iconClassName: 'text-[var(--color-interactive)]',
  },
  next: {
    label: 'Next',
    icon: Rocket,
    className: 'bg-[var(--color-sand-100)] text-[var(--color-sand-400)]',
    iconClassName: 'text-[var(--color-sand-400)]',
  },
  later: {
    label: 'Committed',
    icon: Clock,
    className: 'bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)]',
    iconClassName: 'text-[var(--color-text-tertiary)]',
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  profile: 'Profile',
  network: 'Network',
  cv: 'CV',
  insights: 'Insights',
  general: 'General',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) || 'roadmap'
  const [activeTab, setActiveTab] = useState<Tab>(
    ['roadmap', 'requests', 'released'].includes(initialTab) ? initialTab : 'roadmap',
  )
  const [suggestions, setSuggestions] = useState<FeatureSuggestion[]>([])
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('votes')
  const [loading, setLoading] = useState(true)
  const [votingIds, setVotingIds] = useState<Set<string>>(new Set())

  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()

  // Load suggestions + user votes when switching to requests tab
  const loadSuggestions = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: { user } }, { data: sugData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('feature_suggestions')
          .select('id, title, description, category, status, vote_count, created_at')
          .in('status', ['suggested', 'under_review', 'planned'])
          .order('vote_count', { ascending: false })
          .limit(50),
      ])

      if (user) {
        setUserId(user.id)
        const { data: votes } = await supabase
          .from('feature_votes')
          .select('suggestion_id')
          .eq('user_id', user.id)
        setUserVotes(new Set((votes ?? []).map((v) => v.suggestion_id)))
      }

      setSuggestions(sugData ?? [])
    } catch {
      toast('Failed to load requests', 'error')
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  useEffect(() => {
    if (activeTab === 'requests') {
      loadSuggestions()
    }
  }, [activeTab, loadSuggestions])

  // Refs for stable toggleVote closure
  const userVotesRef = useRef(userVotes)
  userVotesRef.current = userVotes
  const votingIdsRef = useRef(votingIds)
  votingIdsRef.current = votingIds

  // Vote toggle
  const toggleVote = useCallback(
    async (suggestionId: string) => {
      if (!userId || votingIdsRef.current.has(suggestionId)) return

      setVotingIds((prev) => new Set(prev).add(suggestionId))
      const hasVoted = userVotesRef.current.has(suggestionId)

      // Optimistic update
      setUserVotes((prev) => {
        const next = new Set(prev)
        if (hasVoted) next.delete(suggestionId)
        else next.add(suggestionId)
        return next
      })
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestionId
            ? { ...s, vote_count: Math.max(0, s.vote_count + (hasVoted ? -1 : 1)) }
            : s,
        ),
      )

      try {
        if (hasVoted) {
          const { error } = await supabase
            .from('feature_votes')
            .delete()
            .eq('user_id', userId)
            .eq('suggestion_id', suggestionId)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('feature_votes')
            .insert({ user_id: userId, suggestion_id: suggestionId })
          if (error) throw error
        }
      } catch {
        // Revert optimistic update
        setUserVotes((prev) => {
          const next = new Set(prev)
          if (hasVoted) next.add(suggestionId)
          else next.delete(suggestionId)
          return next
        })
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === suggestionId
              ? { ...s, vote_count: Math.max(0, s.vote_count + (hasVoted ? 1 : -1)) }
              : s,
          ),
        )
        toast('Failed to update vote', 'error')
      } finally {
        setVotingIds((prev) => {
          const next = new Set(prev)
          next.delete(suggestionId)
          return next
        })
      }
    },
    [userId, supabase, toast],
  )

  // Sorted suggestions
  const sortedSuggestions = useMemo(() => {
    const sorted = [...suggestions]
    if (sortMode === 'votes') {
      sorted.sort((a, b) => b.vote_count - a.vote_count)
    } else {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return sorted
  }, [suggestions, sortMode])

  return (
    <PageTransition className="flex flex-col gap-0 pb-24">
      <PageHeader backHref="/app/more" title="Feature Roadmap" />

      {/* Segment control */}
      <div className="flex bg-[var(--color-surface-raised)] rounded-xl p-1 mb-4">
        {([
          { key: 'roadmap' as const, label: 'Roadmap' },
          { key: 'requests' as const, label: 'Requests' },
          { key: 'released' as const, label: 'Released' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === key
                ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'roadmap' && <RoadmapTab />}
      {activeTab === 'requests' && (
        <RequestsTab
          suggestions={sortedSuggestions}
          userVotes={userVotes}
          loading={loading}
          sortMode={sortMode}
          setSortMode={setSortMode}
          onVote={toggleVote}
          votingIds={votingIds}
          userId={userId}
        />
      )}
      {activeTab === 'released' && <ReleasedTab />}
    </PageTransition>
  )
}

// ─── Tab: Roadmap ─────────────────────────────────────────────────────────────

function RoadmapTab() {
  const stages: { stage: RoadmapStage; title: string }[] = [
    { stage: 'in_progress', title: 'In Progress' },
    { stage: 'next', title: 'Next' },
    { stage: 'later', title: 'Committed' },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      <p className="text-sm text-[var(--color-text-secondary)]">
        What we&apos;re building and what&apos;s coming next. Your votes on Feature Requests help shape this list.
      </p>

      {stages.map(({ stage, title }) => {
        const items = ROADMAP_ITEMS.filter((i) => i.stage === stage)
        if (items.length === 0) return null
        const config = STAGE_CONFIG[stage]
        const Icon = config.icon

        return (
          <motion.div key={stage} variants={fadeUp}>
            <div className="flex items-center gap-2 mb-3">
              <Icon size={14} className={config.iconClassName} />
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                {title}
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={item.title}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {item.title}
                    </h3>
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-2">
                    {item.description}
                  </p>
                  <span className="text-xs text-[var(--color-text-tertiary)]">{item.category}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ─── Tab: Feature Requests ────────────────────────────────────────────────────

function RequestsTab({
  suggestions,
  userVotes,
  loading,
  sortMode,
  setSortMode,
  onVote,
  votingIds,
  userId,
}: {
  suggestions: FeatureSuggestion[]
  userVotes: Set<string>
  loading: boolean
  sortMode: SortMode
  setSortMode: (m: SortMode) => void
  onVote: (id: string) => void
  votingIds: Set<string>
  userId: string | null
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      {/* CTA card */}
      <motion.div
        variants={fadeUp}
        className="bg-[var(--color-sand-100)] border border-[var(--color-sand-200)] rounded-2xl p-4"
      >
        <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
          Have an idea? We build what the community wants.
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          Submit a feature request and vote on ideas from other crew.
        </p>
        <Link
          href="/app/more/roadmap/suggest"
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150 active:scale-[0.97]"
        >
          <Plus size={16} />
          Submit a request
        </Link>
      </motion.div>

      {/* Sort control */}
      <motion.div variants={fadeUp} className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-text-tertiary)]">Sort:</span>
        {(['votes', 'newest'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
              sortMode === mode
                ? 'bg-[var(--color-sand-200)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {mode === 'votes' ? 'Most Voted' : 'Newest'}
          </button>
        ))}
      </motion.div>

      {/* Suggestions list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 animate-pulse"
            >
              <div className="h-4 bg-[var(--color-surface-raised)] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[var(--color-surface-raised)] rounded w-full mb-1" />
              <div className="h-3 bg-[var(--color-surface-raised)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="text-center py-12"
        >
          <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
            No feature requests yet
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Be the first to suggest something. The best ideas come from crew who use the platform every day.
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3">
          {suggestions.map((s) => {
            const voted = userVotes.has(s.id)
            const isVoting = votingIds.has(s.id)

            return (
              <motion.div
                key={s.id}
                variants={fadeUp}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex gap-3"
              >
                {/* Vote button */}
                <button
                  onClick={() => onVote(s.id)}
                  disabled={!userId || isVoting}
                  className={`shrink-0 flex flex-col items-center justify-center w-12 min-h-[44px] rounded-xl transition-colors ${
                    voted
                      ? 'bg-[var(--color-interactive)] text-white'
                      : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-sand-100)]'
                  } ${isVoting ? 'opacity-50' : ''}`}
                  aria-label={voted ? 'Remove vote' : 'Upvote'}
                >
                  <ChevronUp size={16} className={voted ? 'text-white' : ''} />
                  <span className="text-xs font-semibold">{s.vote_count}</span>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-0.5">
                    {s.title}
                  </h3>
                  {s.description && (
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-2 mb-1.5">
                      {s.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {s.category && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)]">
                        {CATEGORY_LABELS[s.category] ?? s.category}
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">
                      {timeAgo(s.created_at)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

// ─── Tab: Released ────────────────────────────────────────────────────────────

function ReleasedTab() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3"
    >
      <p className="text-sm text-[var(--color-text-secondary)] mb-2">
        Features we&apos;ve shipped. Your feedback made these happen.
      </p>

      {RELEASED_ITEMS.map((item) => (
        <motion.div
          key={item.title}
          variants={fadeUp}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4"
        >
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {item.title}
            </h3>
            <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)]">
              Shipped
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-2">
            {item.description}
          </p>
          <span className="text-xs text-[var(--color-text-tertiary)]">{item.category}</span>
        </motion.div>
      ))}
    </motion.div>
  )
}
