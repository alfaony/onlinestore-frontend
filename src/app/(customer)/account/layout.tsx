'use client'
import { useMemberStore } from '@/stores/member.store'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import './account.css'

const S = {
  red:'#C41E3A', navy:'#1B3A6B', gold:'#E8A020',
  creamDp:'#EDD9B8', gray:'#6B7280', grayL:'#F3F0EB',
  dark:'#1A1A2E', green:'#10B981',
}

const NAV_ITEMS = [
  { href:'/account/profile',   icon:'👤', label:'Profil' },
  { href:'/account/addresses', icon:'📍', label:'Alamat Saya' },
  { href:'/account/orders',    icon:'📦', label:'Pesanan' },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { member, token, clearMember } = useMemberStore()

  // Guard — redirect ke login kalau belum auth
  useEffect(() => {
    if (!token && pathname !== '/account/login') {
      router.replace('/account/login')
    }
  }, [token, pathname, router])

  // Halaman login — tidak pakai sidebar
  if (pathname === '/account/login') return <>{children}</>

  // Belum hydrate / belum login → jangan render
  if (!member || !token) return null

  return (
    <div className="c-app account-shell">
      <div className="account-layout">

        {/* ── Sidebar ── */}
        <aside className="account-sidebar">
          {/* Avatar */}
          <div className="account-identity">
            <div className="account-identity-inner">
              <div className="account-avatar" style={{ background:`linear-gradient(135deg, ${S.navy}, ${S.red})` }}>
                {(member.name ?? member.phone ?? '?')[0].toUpperCase()}
              </div>
              <div className="account-identity-copy">
                <p style={{ fontSize:14, fontWeight:700, color:S.dark }}>{member.name ?? 'Member'}</p>
                <p style={{ fontSize:11, color:S.gray, marginTop:2 }}>+{member.phone}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="account-nav" aria-label="Navigasi akun">
            {NAV_ITEMS.map((item, i) => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} className={`account-nav-link${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  style={{
                    borderBottom: i < NAV_ITEMS.length-1 ? `1px solid ${S.grayL}` : 'none',
                  }}>
                  <span style={{ fontSize:16 }}>{item.icon}</span>
                  <span style={{ fontSize:13, fontWeight: active ? 600 : 400, color: active ? S.red : S.dark }}>
                    {item.label}
                  </span>
                </Link>
              )
            })}

            {/* Logout */}
            <button
              onClick={() => { clearMember(); router.push('/') }}
              className="account-logout">
              <span style={{ fontSize:16 }}>🚪</span>
              <span style={{ fontSize:13, color:S.gray }}>Keluar</span>
            </button>
          </nav>
        </aside>

        {/* ── Content ── */}
        <main className="account-content">{children}</main>
      </div>
    </div>
  )
}
