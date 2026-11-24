import localFont from 'next/font/local';

// Vazirmatn (v33.0.3, SIL OFL 1.1 — see OFL.txt), the ADMIN module's font.
// One variable file covers every weight 100–900; Latin glyphs (usernames, emails) come from Roboto inside it.
// Served by Next from our own build (no Google Fonts / CDN). The storefront gets its own font with the theme.
export const vazirmatn = localFont({
  src: './Vazirmatn-wght.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-admin',
  fallback: ['Tahoma', 'sans-serif'],
});
