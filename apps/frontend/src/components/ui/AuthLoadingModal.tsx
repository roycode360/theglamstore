import React from 'react';

interface AuthLoadingModalProps {
  isOpen: boolean;
  step: string;
}

export const AuthLoadingModal: React.FC<AuthLoadingModalProps> = ({
  isOpen,
  step,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="theme-border theme-card relative w-auto max-w-sm rounded-xl border p-8 shadow-2xl ring-1 ring-[rgb(var(--brand-300))]/20">
        {/* Gradient accent bar */}
        <div
          className="absolute left-0 right-0 top-0 h-1.5 rounded-t-xl"
          style={{
            background:
              'linear-gradient(90deg, rgba(var(--brand-200),0.9) 0%, rgba(var(--brand-400),0.95) 50%, rgba(var(--brand-300),0.9) 100%)',
          }}
        />

        <div className="text-center">
          {/* Animated logo/icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div
                className="h-16 w-16 animate-spin rounded-full border-4 border-transparent"
                style={{
                  borderTopColor: 'rgb(var(--brand-500))',
                  borderRightColor: 'rgb(var(--brand-300))',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-6 w-6"
                  style={{ color: 'rgb(var(--brand-600))' }}
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2
            className="mb-2 text-xl font-semibold"
            style={{ color: 'rgb(var(--brand-900))' }}
          >
            {step.includes('Welcome') ? 'Welcome!' : 'Authenticating'}
          </h2>

          {/* Step description */}
          <p className="mb-6 text-sm" style={{ color: 'rgb(var(--muted))' }}>
            {step || 'Please wait while we set up your account...'}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center space-x-2">
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                className="h-2 w-2 animate-pulse rounded-full"
                style={{
                  backgroundColor: 'rgb(var(--brand-300))',
                  animationDelay: `${dot * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
