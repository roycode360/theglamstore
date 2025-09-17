import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';

export default function AppLayout() {
  return (
    <div className="min-h-screen text-gray-900 bg-gray-50">
      <main className="px-2 py-8 mx-auto max-w-7xl sm:px-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
