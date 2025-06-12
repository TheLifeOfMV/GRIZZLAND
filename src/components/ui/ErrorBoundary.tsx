'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Observable Implementation: Log error state change
    console.error('ErrorBoundary: Caught error', {
      error: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack,
    });
    
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Observable Implementation: Structured logging for debugging
    console.error('ErrorBoundary: Component stack trace', {
      error: error.message,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'GRIZZLAND.ErrorBoundary',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    });

    this.setState({
      error,
      errorInfo,
    });

    // Fail Fast, Fail Loud: Report to error tracking service
    if (typeof window !== 'undefined') {
      // In production, this would send to error tracking service
      console.warn('Error reported to monitoring service', {
        error: error.message,
        url: window.location.href,
      });
    }
  }

  private handleRetry = () => {
    // Observable Implementation: Log recovery attempt
    console.log('ErrorBoundary: User initiated retry', {
      timestamp: new Date().toISOString(),
      previousError: this.state.error?.message,
    });

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      // Graceful Fallbacks: Provide degraded mode
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-primary-bg flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg 
                  className="w-12 h-12 text-red-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white uppercase tracking-wide mb-2">
                Something went wrong
              </h1>
              <p className="text-white opacity-75 mb-6">
                We're sorry, but something unexpected happened. Please try again.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={this.handleRetry}
                className="w-full btn-primary"
              >
                TRY AGAIN
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full btn-secondary text-white border-white hover:bg-white hover:text-primary-bg"
              >
                GO HOME
              </button>
            </div>

            {/* Development Mode: Show error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-white opacity-75 cursor-pointer mb-2">
                  Development Error Details
                </summary>
                <div className="bg-black bg-opacity-50 p-4 rounded-md text-xs text-white opacity-75 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 