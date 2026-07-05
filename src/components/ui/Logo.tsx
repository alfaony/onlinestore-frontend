interface Props { size?: number; light?: boolean }

export default function Logo({ size = 28, light = false }: Props) {
  return (
    <svg width={size * 2.8} height={size} viewBox="0 0 112 40" fill="none" className="block">
      <path d="M20 28Q14 20 16 12Q18 6 24 8Q28 4 32 8Q38 6 40 12Q42 20 36 28Z" fill="#C41E3A" opacity="0.1"/>
      <line x1="24" y1="28" x2="36" y2="28" stroke="#C41E3A" strokeWidth="1.5"/>
      <line x1="24" y1="28" x2="24" y2="16" stroke="#C41E3A" strokeWidth="1.5"/>
      <line x1="36" y1="28" x2="36" y2="16" stroke="#C41E3A" strokeWidth="1.5"/>
      <path d="M18 28Q30 22 42 28" stroke="#C41E3A" strokeWidth="1.5" fill="none"/>
      <path d="M21 16Q30 12 39 16" stroke="#C41E3A" strokeWidth="1" fill="none"/>
      <line x1="27" y1="16" x2="27" y2="22" stroke="#C41E3A" strokeWidth="1"/>
      <line x1="30" y1="16" x2="30" y2="21" stroke="#C41E3A" strokeWidth="1"/>
      <line x1="33" y1="16" x2="33" y2="22" stroke="#C41E3A" strokeWidth="1"/>
      <path d="M34 10Q37 8 36 12Q35 10 34 10Z" fill="#E8A020"/>
      <text x="48" y="20" fontFamily="var(--font-display), Georgia, serif" fontWeight="700" fontSize="14" fill={light ? '#FFFFFF' : '#1B3A6B'}>SERASO</text>
      <text x="48" y="32" fontFamily="var(--font-body), sans-serif" fontSize="8" fill={light ? '#F5C55A' : '#C41E3A'} letterSpacing="3">PALEMBANG</text>
    </svg>
  )
}
