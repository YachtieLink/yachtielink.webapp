'use client'

import { Mail, Phone, MessageCircle } from 'lucide-react'

interface ContactTileProps {
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  showEmail?: boolean
  showPhone?: boolean
  showWhatsapp?: boolean
}

export function ContactTile({ email, phone, whatsapp, showEmail, showPhone, showWhatsapp }: ContactTileProps) {
  const items: Array<{ icon: React.ReactNode; label: string; href: string }> = []

  if (showEmail !== false && email) {
    items.push({ icon: <Mail size={16} />, label: 'Email', href: `mailto:${email}` })
  }
  if (showPhone !== false && phone) {
    items.push({ icon: <Phone size={16} />, label: 'Call', href: `tel:${phone}` })
  }
  if (showWhatsapp !== false && whatsapp) {
    const clean = whatsapp.replace(/\D/g, '')
    items.push({ icon: <MessageCircle size={16} />, label: 'WhatsApp', href: `https://wa.me/${clean}` })
  }

  if (items.length === 0) {
    return (
      <div className="h-full rounded-xl bg-white/80 p-5 flex items-center justify-center">
        <p className="text-xs text-[var(--color-text-tertiary)]">No contact info shared</p>
      </div>
    )
  }

  return (
    <div className="h-full rounded-xl bg-white/80 p-5 flex flex-col items-center justify-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">Contact</span>
      <div className="flex gap-4">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-1 text-[var(--color-text-secondary)] hover:text-[var(--accent-500,#14b8a6)] transition-colors"
            aria-label={item.label}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
