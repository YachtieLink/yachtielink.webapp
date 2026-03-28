'use client'

import { Mail, Phone, MessageSquare } from 'lucide-react'

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
    items.push({ icon: <MessageSquare size={16} />, label: 'WhatsApp', href: `https://wa.me/${clean}` })
  }

  if (items.length === 0) return null

  return (
    <div className="h-full rounded-xl bg-white/80 p-4 flex flex-col justify-center gap-2.5">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-3 text-[var(--color-text-secondary)] hover:text-[var(--accent-500,#14b8a6)] transition-colors"
          aria-label={item.label}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-surface-raised)]">
            {item.icon}
          </span>
          <span className="text-xs font-medium">{item.label}</span>
        </a>
      ))}
    </div>
  )
}
