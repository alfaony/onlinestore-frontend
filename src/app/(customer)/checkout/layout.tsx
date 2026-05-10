// frontend/src/app/(customer)/layout.tsx
import Script from 'next/script'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* Midtrans */}
            <Script
                src="https://app.sandbox.midtrans.com/snap/snap.js"
                data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
                strategy="beforeInteractive"
            />
            {/* Google Maps */}
            <Script
                src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GMAPS_KEY}&libraries=places`}
                strategy="beforeInteractive"
            />
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
        </>
    )
}