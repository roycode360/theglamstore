import Spinner from './Spinner';

export default function PageLoader({
  label = 'Loading...',
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner label={label} />
    </div>
  );
}
