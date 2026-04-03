import { Mail, Phone } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'

interface ContactRowProps {
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  showEmail?: boolean
  showPhone?: boolean
  showWhatsapp?: boolean
  firstName: string
  /** If provided, tapping any icon opens the contact modal instead of direct action */
  onTap?: () => void
}

export function ContactRow({
  email,
  phone,
  whatsapp,
  showEmail,
  showPhone,
  showWhatsapp,
  firstName,
  onTap,
}: ContactRowProps) {
  const hasAny =
    (showEmail && email) || (showPhone && phone) || (showWhatsapp && whatsapp)

  if (!hasAny) return null

  const iconClass = "flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2.5 rounded-full md:rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--accent-500,#14b8a6)] transition-colors"
  const labelClass = "hidden md:inline text-sm font-medium"

  if (onTap) {
    return (
      <button onClick={onTap} className="flex gap-3">
        {showEmail && email && (
          <span className={iconClass}><Mail size={18} /><span className={labelClass}>Email</span></span>
        )}
        {showPhone && phone && (
          <span className={iconClass}><Phone size={18} /><span className={labelClass}>Phone</span></span>
        )}
        {showWhatsapp && whatsapp && (
          <span className={iconClass}><WhatsAppIcon size={18} /><span className={labelClass}>WhatsApp</span></span>
        )}
      </button>
    )
  }

  return (
    <div className="flex gap-3">
      {showEmail && email && (
        <a
          href={`mailto:${email}?subject=${encodeURIComponent(`Hey ${firstName}`)}&body=${encodeURIComponent(`Hey ${firstName}, I saw your profile on YachtieLink.\n\n`)}`}
          className={iconClass}
          aria-label="Email"
        >
          <Mail size={18} /><span className={labelClass}>Email</span>
        </a>
      )}
      {showPhone && phone && (
        <a href={`tel:${phone}`} className={iconClass} aria-label="Phone">
          <Phone size={18} /><span className={labelClass}>Phone</span>
        </a>
      )}
      {showWhatsapp && whatsapp && (
        <a
          href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hey ${firstName}, I saw your profile on YachtieLink. `)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={iconClass}
          aria-label="WhatsApp"
        >
          <WhatsAppIcon size={18} /><span className={labelClass}>WhatsApp</span>
        </a>
      )}
    </div>
  )
}
