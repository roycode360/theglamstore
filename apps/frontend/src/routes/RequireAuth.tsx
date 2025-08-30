import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { ME } from '../graphql/auth';

export default function RequireAuth({
  roles,
}: {
  roles?: Array<'admin' | 'customer'>;
}) {
  const { data, loading } = useQuery(ME);
  const location = useLocation();
  if (loading) return null;
  const me = data?.me ?? null;
  if (!me) return <Navigate to="/" replace state={{ from: location }} />;

  if (roles && roles.length > 0 && (!me.role || !roles.includes(me.role))) {
    return <Navigate to="/not-authorized" replace />;
  }
  return <Outlet />;
}
