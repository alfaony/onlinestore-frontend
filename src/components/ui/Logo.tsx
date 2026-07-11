import Image from 'next/image'

interface Props {
  height?: number
  light?: boolean
  variant?: 'header' | 'footer-dark' | 'fullwhite'
}

const SOURCES = {
  header: '/header.png',
  'footer-dark': '/footer-dark.png',
  fullwhite: '/fullwhite.png',
} as const

export default function Logo({ height = 52, light = false, variant }: Props) {
  const selectedVariant = variant ?? (light ? 'fullwhite' : 'header')

  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        width: Math.round(height * 1.35),
        height,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <Image
        src={SOURCES[selectedVariant]}
        width={height * 3}
        height={height}
        alt="Seraso Palembang"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: height * 3,
          height,
          maxWidth: 'none',
          objectFit: 'contain',
          transform: 'translateX(-50%)',
        }}
      />
    </span>
  )
}
