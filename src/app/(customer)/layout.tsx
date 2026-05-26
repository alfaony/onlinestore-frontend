// src/app/(customer)/layout.tsx
import Script from 'next/script'
import AnnouncementBar from '@/components/layout/AnnouncementBar'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartProvider from '@/components/cart/CartProvider'
import { Toaster } from 'sonner'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
    return (
        <CartProvider>
            {/* Midtrans Snap */}
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
            <div className="animate-fade-up">{children}</div>
            <Footer />
            <Toaster position="bottom-right" />
        </CartProvider>
    )
}