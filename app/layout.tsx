import Providers from '@/components/layout/providers';
import { Toaster } from 'sonner';
import { fontVariables } from '@/lib/font';
import ThemeProvider from '@/components/layout/ThemeToggle/theme-provider';
import { QueryProvider } from "@/providers/query-provider";
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { UserProvider } from "@/context/UserContext";
import AppTopLoader from '@/components/layout/app-top-loader';
import './globals.css';
import './theme.css';

const META_THEME_COLORS = {
  light: '#ffffff',
  dark: '#09090b'
};

export const metadata: Metadata = {
  applicationName: 'SenioSentry',
  title: {
    default: 'SenioSentry',
    template: '%s | SenioSentry',
  },
  description: 'Monitoring and management platform for SenioSentry',
  manifest: '/manifest.json',
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SenioSentry',
    startupImage: ['/assets/images/logo.png'],
  },
  icons: {
    icon: '/assets/images/logo.png',
    shortcut: '/assets/images/logo.png',
    apple: '/assets/images/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: META_THEME_COLORS.light },
    { media: '(prefers-color-scheme: dark)', color: META_THEME_COLORS.dark },
  ],
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const activeThemeValue = "blue";
  const isScaled = activeThemeValue?.endsWith('-scaled');

  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]').setAttribute('content', '${META_THEME_COLORS.dark}')
                }
              } catch (_) {}
              try {
                var lang = localStorage.getItem('i18nextLng') || 'en';
                var isFa = lang.indexOf('fa') === 0;
                document.documentElement.lang = isFa ? 'fa' : 'en';
                document.documentElement.dir = isFa ? 'rtl' : 'ltr';
              } catch (_) {}
            `
          }}
        />
      </head>
      <body
        className={cn(
          'bg-background overscroll-none font-sans antialiased',
          activeThemeValue ? `theme-${activeThemeValue}` : '',
          isScaled ? 'theme-scaled' : '',
          fontVariables
        )}
      >
        <AppTopLoader />
        <NuqsAdapter>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            <Providers activeThemeValue={activeThemeValue as string}>
              <QueryProvider>
              <UserProvider>
                {children}
                <Toaster richColors position="top-center" />
              </UserProvider>
              </QueryProvider>
            </Providers>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
