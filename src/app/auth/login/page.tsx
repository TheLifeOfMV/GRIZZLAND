import type { Metadata } from 'next';
import { EnhancedLoginForm } from '@/components/auth/LoginForm';

// Page metadata
export const metadata: Metadata = {
  title: 'Sign In | GRIZZLAND - Premium Streetwear',
  description: 'Sign in to your GRIZZLAND account to access exclusive streetwear collections, manage your orders, and enjoy personalized shopping experience.',
  keywords: ['login', 'sign in', 'grizzland', 'account', 'streetwear', 'authentication'],
  robots: {
    index: false, // Don't index login pages
    follow: false,
  },
  openGraph: {
    title: 'Sign In | GRIZZLAND',
    description: 'Access your GRIZZLAND account',
    type: 'website',
    siteName: 'GRIZZLAND',
  },
  twitter: {
    card: 'summary',
    title: 'Sign In | GRIZZLAND',
    description: 'Access your GRIZZLAND account',
  },
};

// Login page component
export default function LoginPage() {
  return (
    <main className="min-h-screen bg-primary-bg">
      <EnhancedLoginForm
        type="user"
        brandLogo={true}
        showSocialLogin={false}
        allowGuestAccess={true}
        redirectTo="/"
      />
    </main>
  );
} 