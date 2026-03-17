'use client'

import dynamic from 'next/dynamic'

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false })

interface PublicQRCodeProps {
  handle: string
}

export function PublicQRCode({ handle }: PublicQRCodeProps) {
  return (
    <QRCode
      value={`https://yachtie.link/u/${handle}`}
      size={80}
      level="M"
      bgColor="transparent"
      fgColor="var(--color-text-tertiary)"
    />
  )
}
