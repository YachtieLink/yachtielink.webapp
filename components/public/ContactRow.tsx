import { Mail, Phone, MessageCircle } from 'lucide-react'

interface ContactRowProps {
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  showEmail?: boolean
  showPhone?: boolean
  showWhatsapp?: boolean
  firstName: string
}

export function ContactRow({
  email,
  phone,
  whatsapp,
  showEmail,
  showPhone,
  showWhatsapp,
  firstName,
}: ContactRowProps) {
  const hasAny =
    (showEmail && email) || (showPhone && phone) || (showWhatsapp && whatsapp)

  if (!hasAny) return null

  return (
    <div className="flex items-center gap-3 py-2">
      {showEmail && email && (
        <a
          href={`mailto:${email}?subject=${encodeURIComponent(`Hey ${firstName}`)}&body=${encodeURIComponent(`Hey ${firstName}, I saw your profile on YachtieLink.\n\n`)}`}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-interactive)] hover:border-[var(--color-interactive)] transition-colors"
          aria-label="Email"
        >
          <Mail size={18} />
        </a>
      )}
      {showPhone && phone && (
        <a
          href={`tel:${phone}`}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-interactive)] hover:border-[var(--color-interactive)] transition-colors"
          aria-label="Phone"
        >
          <Phone size={18} />
        </a>
      )}
      {showWhatsapp && whatsapp && (
        <a
          href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hey ${firstName}, I saw your profile on YachtieLink. `)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-green-600 hover:border-green-500 transition-colors"
          aria-label="WhatsApp"
        >
          <MessageCircle size={18} />
        </a>
      )}
    </div>
  )
}
