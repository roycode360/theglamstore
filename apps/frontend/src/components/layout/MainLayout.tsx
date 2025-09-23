import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import ScrollToTop from './ScrollToTop';
import { AuthLoadingModal } from '../ui/AuthLoadingModal';
import { useAuth } from '../../contexts/AuthContext';

export default function MainLayout() {
  const { loading, authStep } = useAuth();

  return (
    <div>
      <ScrollToTop />
      <Header />
      <Outlet />
      <AuthLoadingModal isOpen={loading} step={authStep} />
    </div>
  );
}
