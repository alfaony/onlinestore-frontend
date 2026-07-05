type TagColor = 'red' | 'gold' | 'navy' | 'green' | 'gray'
interface Props { children: React.ReactNode; color?: TagColor }

const map: Record<TagColor, string> = {
  red:   'c-tag c-tag-red',
  gold:  'c-tag c-tag-gold',
  navy:  'c-tag c-tag-navy',
  green: 'c-tag c-tag-green',
  gray:  'c-tag c-tag-gray',
}

export default function Tag({ children, color = 'red' }: Props) {
  return <span className={map[color]}>{children}</span>
}
