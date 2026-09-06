import Link from 'next/link';

export default function Header({ user, onSignOut }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          AI Resume Roaster
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden max-w-44 truncate text-sm text-slate-600 sm:block">
              {user.name || user.email}
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
