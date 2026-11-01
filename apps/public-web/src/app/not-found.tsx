export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-slate-200 mb-4">404</p>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-sm text-slate-500 mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-md transition-colors shadow-sm"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}

