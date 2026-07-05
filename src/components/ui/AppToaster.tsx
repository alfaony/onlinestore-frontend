'use client'

import { Toaster } from 'sonner'

export default function AppToaster() {
  return (
    <Toaster
      className="app-toaster"
      position="top-center"
      offset={{ top: 76 }}
      mobileOffset={12}
      richColors
      closeButton
      visibleToasts={4}
      gap={10}
      duration={4200}
      containerAriaLabel="Notifikasi Seraso"
      toastOptions={{
        closeButtonAriaLabel: 'Tutup notifikasi',
        style: {
          borderRadius: 14,
          fontSize: 13,
        },
      }}
    />
  )
}
