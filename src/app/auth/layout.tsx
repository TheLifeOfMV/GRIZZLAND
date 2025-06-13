import type { Metadata } from 'next';
import React from 'react';

// Auth layout metadata
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  other: {
    'referrer': 'no-referrer-when-downgrade',
  },
};

// Auth layout props
interface AuthLayoutProps {
  children: React.ReactNode;
}

// Auth layout component
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      {/* Skip to main content for accessibility */}
      <a 
        href="#auth-main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white text-primary-bg px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Main auth content */}
      <main id="auth-main-content" className="min-h-screen">
        {children}
      </main>

      {/* Background overlay for visual enhancement */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-bg via-primary-bg to-gray-900 -z-10"></div>
    </div>
  );
} 