export default function NotAuthorized() {
  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="text-2xl font-semibold">Not authorized</div>
      <div className="mt-2" style={{ color: 'rgb(var(--muted))' }}>
        You do not have permission to access this page.
      </div>
    </div>
  );
}
