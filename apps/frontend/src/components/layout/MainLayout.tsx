import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import ScrollToTop from './ScrollToTop';

export default function MainLayout() {
  return (
    <div>
      <ScrollToTop />
      <Header />
      <Outlet />
    </div>
  );
}
