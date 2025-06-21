import './globals.css'
import { TRPCProvider } from '@/trpc/provider'

export const metadata = {
  title: "Game Draft",
  description: "Web app to help you choose a game for game night",
  icons: {
    icon: './favicon.svg'
  }
}

export const viewport = {
  width: 'device-width'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  )
}