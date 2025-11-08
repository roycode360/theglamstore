import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { from?: string } };
  const { isUserAuthenticated, login, loading, authStep, isLoginProcess } =
    useAuth();

  useEffect(() => {
    if (isUserAuthenticated) {
      // If already logged in, go back to intended page or home
      const to = state?.from || '/';
      navigate(to, { replace: true });
    }
  }, [isUserAuthenticated, navigate, state]);

  const maxLabelLen = 28;
  const defaultLabel =
    loading || isLoginProcess ? 'Please wait…' : 'Continue to Login';
  const btnLabel = authStep
    ? authStep.length > maxLabelLen
      ? authStep.slice(0, maxLabelLen) + '…'
      : authStep
    : defaultLabel;

  return (
    <main className="relative min-h-screen">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        {/* Visual side */}
        <div className="relative hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&q=80&w=2000&h=1333"
            className="object-cover object-center w-full h-full"
            alt="Fashion"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Form side */}
        <div className="flex items-center justify-center h-full px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'rgb(var(--muted))' }}>
              Sign in to continue shopping and manage your account.
            </p>

            <button
              onClick={() => login()}
              disabled={loading || isLoginProcess || Boolean(authStep)}
              className="inline-flex items-center justify-center w-full px-5 py-3 mt-6 text-sm font-semibold text-white transition-colors bg-black rounded-full hover:bg-black/90 disabled:opacity-50"
            >
              <span className="max-w-full truncate">{btnLabel}</span>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span
                  className="w-full border-t"
                  style={{ borderColor: 'rgb(var(--border))' }}
                />
              </div>
              <div className="relative flex justify-center">
                <span
                  className="px-3 text-xs bg-white"
                  style={{ color: 'rgb(var(--muted))' }}
                >
                  or continue with
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <button
                onClick={() => login()}
                className="py-2 text-xs bg-white border rounded-full theme-border"
              >
                Google
              </button>
            </div>

            <div
              className="mt-4 text-xs text-center"
              style={{ color: 'rgb(var(--muted))' }}
            >
              By continuing, you agree to our{' '}
              <Link to="/terms-of-service" className="underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy-policy" className="underline">
                Privacy Policy
              </Link>
              .
            </div>

            {/* authStep now shown inside button label; removed separate status box */}

            <div className="mt-8 text-sm text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 hover:underline"
              >
                <span>←</span>
                <span>Back to shopping</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
