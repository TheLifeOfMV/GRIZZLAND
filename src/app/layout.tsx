import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/hooks/useCart';
import Header from '@/components/layout/Header';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GRIZZLAND - Premium Streetwear',
  description: 'Discover GRIZZLAND\'s signature collection of premium streetwear. Shop the latest designs featuring our iconic silhouette graphics and high-quality materials.',
  keywords: ['streetwear', 'premium clothing', 'fashion', 'grizzland', 'urban wear', 'lifestyle'],
  authors: [{ name: 'GRIZZLAND' }],
  creator: 'GRIZZLAND',
  publisher: 'GRIZZLAND',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://grizzland.com',
    siteName: 'GRIZZLAND',
    title: 'GRIZZLAND - Premium Streetwear',
    description: 'Discover GRIZZLAND\'s signature collection of premium streetwear.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=630&fit=crop&q=80',
        width: 1200,
        height: 630,
        alt: 'GRIZZLAND Premium Streetwear',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GRIZZLAND - Premium Streetwear',
    description: 'Discover GRIZZLAND\'s signature collection of premium streetwear.',
    images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=630&fit=crop&q=80'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Viewport meta tag for responsive design */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#1a2c28" />
        
        {/* Performance hint for critical resources */}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className={`${inter.className} antialiased bg-primary-bg text-primary-text`}>
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white text-primary-bg px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>
        
        <CartProvider>
          <ErrorBoundary>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main id="main-content" className="flex-1">
                {children}
              </main>
            <footer className="bg-primary-bg border-t border-white py-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  <p className="text-sm text-white opacity-75">
                    © 2024 GRIZZLAND. All rights reserved.
                  </p>
                  <div className="mt-4 flex justify-center space-x-6">
                    <a 
                      href="#" 
                      className="text-white opacity-75 hover:opacity-100 transition-opacity duration-200"
                      aria-label="Follow us on Instagram"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.611-3.197-1.559-.187-.237-.318-.513-.318-.826 0-.434.262-.826.656-.826.328 0 .59.213.721.525.197.459.656.787 1.181.787.722 0 1.312-.59 1.312-1.312 0-.722-.59-1.312-1.312-1.312-.656 0-1.181.525-1.181 1.181h-.787c0-1.082.885-1.968 1.968-1.968s1.968.885 1.968 1.968c0 1.082-.885 1.968-1.968 1.968z"/>
                      </svg>
                    </a>
                    <a 
                      href="#" 
                      className="text-white opacity-75 hover:opacity-100 transition-opacity duration-200"
                      aria-label="Follow us on Twitter"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </a>
                    <a 
                      href="#" 
                      className="text-white opacity-75 hover:opacity-100 transition-opacity duration-200"
                      aria-label="Connect with us on LinkedIn"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
          </ErrorBoundary>
        </CartProvider>

        {/* Performance monitoring script placeholder */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Performance monitoring
              window.addEventListener('load', function() {
                if ('performance' in window) {
                  console.log('Page load time:', performance.timing.loadEventEnd - performance.timing.navigationStart, 'ms');
                }
              });
            `,
          }}
        />
      </body>
    </html>
  );
} 