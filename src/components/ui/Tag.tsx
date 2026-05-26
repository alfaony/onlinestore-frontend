type TagColor = 'red' | 'gold' | 'navy' | 'green' | 'gray'
interface Props { children: React.ReactNode; color?: TagColor }

const map: Record<TagColor, string> = {
  red:   'tag-red',
  gold:  'tag-gold',
  navy:  'tag-navy',
  green: 'tag-green',
  gray:  'tag-gray',
}

export default function Tag({ children, color = 'red' }: Props) {
  return <span className={map[color]}>{children}</span>
}
