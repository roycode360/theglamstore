import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type CheckoutInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  notes?: string;
};

type Ctx = {
  info: CheckoutInfo;
  setInfo: (v: CheckoutInfo) => void;
  reset: () => void;
};

const DEFAULT: CheckoutInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address1: '',
  city: '',
  state: '',
  notes: '',
};

const CheckoutContext = createContext<Ctx | undefined>(undefined);
const KEY = 'glam.checkout.info';

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [info, setInfo] = useState<CheckoutInfo>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(info));
  }, [info]);

  const value = useMemo<Ctx>(
    () => ({ info, setInfo, reset: () => setInfo(DEFAULT) }),
    [info],
  );
  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider');
  return ctx;
}
