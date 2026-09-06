import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import Header from '../components/Header';

export default function Home() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header user={user} onSignOut={() => signOut({ callbackUrl: '/' })} />
      <main className="mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
        {status === 'loading' ? (
          <div className="rounded-xl bg-white px-8 py-10 shadow-sm" role="status">
            <p className="text-slate-600">Checking your session…</p>
          </div>
        ) : (
          <>
            <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
              Honest feedback, minus the boring part
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              Give your resume a constructive roast.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Upload your PDF and get clear, practical feedback on what to fix before your next application.
            </p>
            {user ? (
              <div className="mt-10 rounded-2xl bg-white p-7 text-left shadow-sm ring-1 ring-slate-200 sm:min-w-96">
                <p className="text-sm font-medium text-slate-500">Signed in as</p>
                <p className="mt-1 truncate text-lg font-semibold">{user.name || user.email}</p>
                {user.email && user.name && <p className="truncate text-sm text-slate-500">{user.email}</p>}
                <Link
                  href="/upload"
                  className="mt-6 block rounded-lg bg-indigo-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-indigo-700"
                >
                  Roast a resume
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/upload' })}
                className="mt-10 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Continue with Google
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
