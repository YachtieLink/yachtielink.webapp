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

  const iconClass = "flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-interactive)] hover:border-[var(--color-interactive)] transition-colors"
  const whatsappClass = "flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-green-600 hover:border-green-500 transition-colors"

  // If onTap is provided, all icons open the modal instead of direct action
  if (onTap) {
    return (
      <div className="flex items-center gap-3 py-2">
        {showEmail && email && (
          <button onClick={onTap} className={iconClass} aria-label="Email">
            <Mail size={18} />
          </button>
        )}
        {showPhone && phone && (
          <button onClick={onTap} className={iconClass} aria-label="Phone">
            <Phone size={18} />
          </button>
        )}
        {showWhatsapp && whatsapp && (
          <button onClick={onTap} className={whatsappClass} aria-label="WhatsApp">
            <WhatsAppIcon size={18} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 py-2">
      {showEmail && email && (
        <a
          href={`mailto:${email}?subject=${encodeURIComponent(`Hey ${firstName}`)}&body=${encodeURIComponent(`Hey ${firstName}, I saw your profile on YachtieLink.\n\n`)}`}
          className={iconClass}
          aria-label="Email"
        >
          <Mail size={18} />
        </a>
      )}
      {showPhone && phone && (
        <a
          href={`tel:${phone}`}
          className={iconClass}
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
          className={whatsappClass}
          aria-label="WhatsApp"
        >
          <WhatsAppIcon size={18} />
        </a>
      )}
    </div>
  )
}
