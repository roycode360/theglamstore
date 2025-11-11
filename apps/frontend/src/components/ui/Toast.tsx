import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  title,
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles =
      'theme-card theme-border w-auto max-w-[92vw] rounded-md border p-4 shadow-lg shadow-black/5 transition-all duration-300';

    return baseStyles;
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg
            className="w-5 h-5 text-green-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 text-red-500 rounded-full bg-gray-50 ring-1 ring-gray-200">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
      case 'info':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 text-blue-500 rounded-full bg-gray-50 ring-1 ring-gray-200">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 text-yellow-500 rounded-full bg-gray-50 ring-1 ring-gray-200">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l6.518 11.59c.75 1.335-.213 2.99-1.742 2.99H3.48c-1.53 0-2.492-1.655-1.743-2.99L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v3a1 1 0 01-1 1z" />
            </svg>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200 dark:bg-neutral-800/50 dark:text-neutral-300 dark:ring-neutral-800">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'success':
        return 'Success!';
      case 'error':
        return 'Error!';
      case 'info':
        return 'Info';
      case 'warning':
        return 'Heads up';
      default:
        return 'Notification';
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${getToastStyles()} ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
    >
      <div className="flex items-start justify-between gap-4 animate-toast-in">
        <div className="flex-1 min-w-0">
          <h3
            className={`theme-fg text-[14px] font-semibold ${type === 'success' ? '!text-green-500' : type === 'error' ? '!text-red-500' : type === 'info' ? '!text-blue-500' : type === 'warning' ? '!text-yellow-500' : '!text-orange-500'}`}
          >
            {getTitle()}
          </h3>
          <p className="theme-fg/90 mt-1 text-[12px] leading-relaxed md:text-[13px]">
            {message}
          </p>
        </div>
        <div className="flex-shrink-0 mt-1">{getIcon()}</div>
      </div>
    </div>
  );
};

interface ToastContextType {
  showToast: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning',
    options?: { title?: string; duration?: number },
  ) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined,
);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      message: string;
      type: 'success' | 'error' | 'info' | 'warning';
      title?: string;
      duration?: number;
    }>
  >([]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning',
    options?: { title?: string; duration?: number },
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [
      ...prev,
      { id, message, type, title: options?.title, duration: options?.duration },
    ]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex max-h-[calc(100vh-2.5rem)] w-auto max-w-[92vw] flex-col gap-3 overflow-y-auto">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              title={toast.title}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
      {/* Global window event to trigger toasts without importing hook */}
      <ToastEventBridge
        onShow={(msg, type, options) => showToast(msg, type as any, options)}
      />
    </ToastContext.Provider>
  );
};

// Event bridge component
function ToastEventBridge({
  onShow,
}: {
  onShow: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning',
    options?: { title?: string; duration?: number },
  ) => void;
}) {
  useEffect(() => {
    const handler = (e: any) => {
      const { message, type, title, duration } = e.detail || {};
      if (!message || !type) return;
      onShow(message, type, { title, duration });
    };
    window.addEventListener('toast:show', handler);
    return () => window.removeEventListener('toast:show', handler);
  }, [onShow]);
  return null;
}
