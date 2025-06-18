import type { Metadata } from 'next';
import { EnhancedLoginForm } from '@/components/auth/LoginForm';

// Page metadata
export const metadata: Metadata = {
  title: 'Admin Login | GRIZZLAND - Administration Panel',
  description: 'Secure access to GRIZZLAND administration panel for authorized personnel only.',
  robots: {
    index: false, // Never index admin pages
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
  openGraph: {
    title: 'Admin Login | GRIZZLAND',
    description: 'Secure admin access',
    type: 'website',
    siteName: 'GRIZZLAND Admin',
  },
  other: {
    'referrer': 'no-referrer', // Enhanced security
  },
};

// Admin login page component
export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-primary-bg">
      {/* Security header warning */}
      <div className="bg-red-900 bg-opacity-50 border-b border-red-500 py-2">
        <div className="container mx-auto px-4">
          <p className="text-center text-red-300 text-sm font-medium">
            🔒 SECURE AREA - This is a restricted access zone for authorized personnel only
          </p>
        </div>
      </div>

      {/* Admin login form */}
      <div className="flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          {/* Enhanced brand logo for admin */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white uppercase tracking-wider">
              GRIZZLAND
            </h1>
            <div className="w-24 h-1 bg-white mx-auto mt-4"></div>
            <p className="text-white opacity-75 text-sm mt-4 uppercase tracking-wide">
              Administration Panel
            </p>
          </div>

          {/* Admin login form container */}
          <div className="bg-primary-bg border border-white rounded-lg p-8 relative">
            {/* Security badge */}
            <div className="absolute -top-3 right-4">
              <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wide rounded">
                ADMIN
              </span>
            </div>

            <EnhancedLoginForm
              brandLogo={false}
              redirectTo="/admin/dashboard"
            />

            {/* Additional security notices */}
            <div className="mt-8 p-4 border border-yellow-500 rounded-md bg-yellow-500 bg-opacity-10">
              <h3 className="text-yellow-300 font-semibold text-sm mb-2 uppercase tracking-wide">
                Security Notice
              </h3>
              <ul className="text-yellow-200 text-xs space-y-1">
                <li>• All login attempts are monitored and logged</li>
                <li>• Unauthorized access attempts will be reported</li>
                <li>• Session timeout: 30 minutes of inactivity</li>
                <li>• Two-factor authentication may be required</li>
              </ul>
            </div>

            {/* Legal disclaimer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-white opacity-50 leading-relaxed">
                By accessing this system, you acknowledge that this is a private system 
                and unauthorized access is prohibited by law. All activities are monitored 
                and may be audited.
              </p>
            </div>
          </div>

          {/* Emergency contact */}
          <div className="mt-8 text-center">
            <p className="text-xs text-white opacity-50">
              For technical support or access issues, contact{' '}
              <a 
                href="mailto:admin@grizzland.com" 
                className="text-white hover:text-gray-300 transition-colors"
              >
                admin@grizzland.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer security notice */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 bg-opacity-80 border-t border-gray-700 py-2">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-400 text-xs">
            GRIZZLAND Admin Portal v2.0 | Secured with SSL | 
            <span className="ml-2">
              Session: {new Date().toLocaleString('en-US', { 
                timeZone: 'UTC',
                hour12: false,
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} UTC
            </span>
          </p>
        </div>
      </div>
    </main>
  );
} 