'use client'

import dynamic from 'next/dynamic'

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false })

interface PublicQRCodeProps {
  handle: string
}

export function PublicQRCode({ handle }: PublicQRCodeProps) {
  return (
    <div className="relative">
      <QRCode
        value={`https://yachtie.link/u/${handle}`}
        size={160}
        level="H"
        bgColor="transparent"
        fgColor="var(--color-teal-700)"
      />
      {/* Logo overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-[var(--color-surface)] rounded-lg p-1.5">
          <span className="text-xs font-bold text-[var(--color-teal-700)] tracking-tight">YL</span>
        </div>
      </div>
    </div>
  )
}
