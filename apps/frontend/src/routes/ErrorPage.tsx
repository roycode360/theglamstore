import React from 'react';
import {
  isRouteErrorResponse,
  Link,
  useNavigate,
  useRouteError,
} from 'react-router-dom';

function getErrorMeta(error: unknown) {
  if (isRouteErrorResponse(error)) {
    const friendlyCopy: Record<number, { title: string; message: string }> = {
      401: {
        title: "You don't have access",
        message: 'Please sign in with the right account to continue.',
      },
      403: {
        title: 'Restricted area',
        message: 'Your current role does not allow you to view this page.',
      },
      404: {
        title: 'We lost that page',
        message:
          'The link may be broken or the page may have been removed recently.',
      },
      500: {
        title: 'Something went wrong',
        message:
          'Our servers had trouble completing your request. Please try again shortly.',
      },
    };

    return {
      statusCode: error.status,
      title: friendlyCopy[error.status]?.title ?? 'Something went wrong',
      message:
        friendlyCopy[error.status]?.message ??
        'An unexpected error occurred while loading this page.',
      details: `${error.status} ${error.statusText}`,
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      title: 'Unexpected application error',
      message:
        'We hit a snag while preparing this view. Please try again in a moment.',
      details: error.message,
    };
  }

  return {
    statusCode: 500,
    title: 'Unexpected application error',
    message:
      'We hit a snag while preparing this view. Please try again in a moment.',
    details: typeof error === 'string' ? error : 'Unknown error',
  };
}

export default function ErrorPage() {
  const routeError = useRouteError();
  const navigate = useNavigate();

  const meta = React.useMemo(() => getErrorMeta(routeError), [routeError]);

  React.useEffect(() => {
    if (routeError instanceof Error) {
      console.error('Route rendering error:', routeError);
    }
  }, [routeError]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16 sm:py-24">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
          TheGlamStore
        </p>
        <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-slate-200/60 bg-white/70 px-5 py-2 text-sm font-medium text-slate-500 backdrop-blur">
          <span className="text-brand bg-brand/10 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            Error {meta.statusCode}
          </span>
          <span>We could not load this view</span>
        </div>

        <h1 className="mt-10 text-center text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
          {meta.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-500">
          {meta.message} Take a breath, then choose your next step below. Style
          never stops—neither do we.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="focus-visible:ring-brand/40 group inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:translate-y-[-2px] hover:bg-white focus-visible:outline-none focus-visible:ring-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-4 w-4 transition group-hover:-translate-x-0.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
            Go Back
          </button>

          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4 transition group-hover:scale-110"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"
              />
            </svg>
            Return home
          </Link>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="focus-visible:ring-brand/40 group inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:translate-y-[-2px] hover:bg-white focus-visible:outline-none focus-visible:ring-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4 transition group-hover:rotate-180"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12a7.5 7.5 0 0112.651-5.303m0 0H13.5m3.651 0V4.5m2.349 7.5a7.5 7.5 0 01-12.651 5.303m0 0H10.5m-3.651 0V19.5"
              />
            </svg>
            Refresh page
          </button>
        </div>
      </div>
    </div>
  );
}
