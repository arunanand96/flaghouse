import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { LayoutShell } from '@/components/LayoutShell'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'FlagHouse',
  description: 'Houses. Briefs. Logs. Flags.',
}

const themeScript = `
(function(){
  function isNight(){var t=new Date(),m=t.getHours()*60+t.getMinutes();return m>=18*60+30||m<6*60+30;}
  var manual=localStorage.getItem('fh-theme-manual')==='true';
  var saved=localStorage.getItem('fh-theme');
  var dark=manual?(saved==='dark'):isNight();
  if(dark)document.documentElement.classList.add('dark');
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.variable}>
        <ThemeProvider>
          <LayoutShell>
            {children}
          </LayoutShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
