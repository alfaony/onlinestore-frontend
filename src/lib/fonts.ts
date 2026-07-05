import localFont from 'next/font/local'

export const displayFont = localFont({
    src: '../app/fonts/cormorant-garamond-latin.woff2',
    variable: '--font-display',
    display: 'swap',
    weight: '500 700',
    style: 'normal',
})

export const bodyFont = localFont({
    src: '../app/fonts/plus-jakarta-sans-latin.woff2',
    variable: '--font-body',
    display: 'swap',
    weight: '200 800',
    style: 'normal',
})
