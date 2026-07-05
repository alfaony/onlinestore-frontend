import CartProvider from '@/components/cart/CartProvider'
import AnnouncementBar from '@/components/home/AnnouncementBar'
import Footer from '@/components/home/Footer'
import Navbar from '@/components/home/Navbar'
import AppToaster from '@/components/ui/AppToaster'
import Script from 'next/script'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Script
        src={
          process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js'
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />
      <AnnouncementBar />
      <Navbar />
      <main style={{ minHeight: '100vh' }}>{children}</main>
      <Footer />
      <AppToaster />
    </CartProvider>
  )
}
