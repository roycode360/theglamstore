import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';

export default function AppLayout() {
  return (
    <div className="flex min-h-[100svh] flex-col bg-gray-50 text-gray-900">
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
