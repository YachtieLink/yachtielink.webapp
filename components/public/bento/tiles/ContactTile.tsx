'use client'

import { Mail, Phone, MessageCircle } from 'lucide-react'

interface ContactTileProps {
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  showEmail?: boolean
  showPhone?: boolean
  showWhatsapp?: boolean
  availableForWork?: boolean
}

export function ContactTile({ email, phone, whatsapp, showEmail, showPhone, showWhatsapp, availableForWork }: ContactTileProps) {
  const items: Array<{ icon: React.ReactNode; label: string; href: string }> = []

  if (showEmail !== false && email) {
    items.push({ icon: <Mail size={18} />, label: 'Email', href: `mailto:${email}` })
  }
  if (showPhone !== false && phone) {
    items.push({ icon: <Phone size={18} />, label: 'Call', href: `tel:${phone}` })
  }
  if (showWhatsapp !== false && whatsapp) {
    const clean = whatsapp.replace(/\D/g, '')
    items.push({ icon: <MessageCircle size={18} />, label: 'WhatsApp', href: `https://wa.me/${clean}` })
  }

  if (items.length === 0) return null

  return (
    <div className="h-full rounded-xl bg-white/80 p-4 flex flex-col items-center justify-center gap-3">
      {availableForWork && (
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-green-600">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Available
        </span>
      )}
      <div className="flex gap-5">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--accent-500,#14b8a6)] hover:bg-[var(--accent-100,#ccfbf1)] transition-colors"
            aria-label={item.label}
          >
            {item.icon}
          </a>
        ))}
      </div>
    </div>
  )
}
