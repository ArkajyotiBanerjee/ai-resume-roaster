import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { signOut, useSession } from 'next-auth/react';
import FeedbackCard from '../components/FeedbackCard';
import Header from '../components/Header';
import ScoreCircle from '../components/ScoreCircle';
import UploadDropzone from '../components/UploadDropzone';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function getErrorMessage(data, fallback) {
  return typeof data?.error === 'string' ? data.error : fallback;
}

function isRoastResult(value) {
  return value
    && typeof value.overallScore === 'number'
    && Array.isArray(value.roasts)
    && value.roasts.every((roast) => typeof roast?.title === 'string' && typeof roast?.comment === 'string')
    && Array.isArray(value.suggestions)
    && value.suggestions.every((suggestion) => typeof suggestion === 'string');
}

export default function UploadPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [file, setFile] = useState(null);
  const [roast, setRoast] = useState(null);
  const [error, setError] = useState('');
  const [stage, setStage] = useState('');

  const isLoading = Boolean(stage);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/');
  }, [router, status]);

  function selectFile(selectedFile) {
    setError('');
    setRoast(null);

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setFile(null);
      setError('Please choose a PDF file.');
      return;
    }

    if (selectedFile.size >= MAX_FILE_SIZE) {
      setFile(null);
      setError('Your PDF must be smaller than 5 MB.');
      return;
    }

    setFile(selectedFile);
  }

  async function readResponse(response, fallback) {
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(getErrorMessage(data, fallback));
    return data;
  }

  async function submitResume(event) {
    event.preventDefault();
    if (isLoading) return;
    if (!file) {
      setError('Choose a PDF resume before roasting.');
      return;
    }

    setError('');
    setRoast(null);

    try {
      setStage('Uploading and reading your PDF…');
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await readResponse(uploadResponse, 'Unable to upload your PDF.');

      if (!uploadData?.success || typeof uploadData.text !== 'string' || !uploadData.text.trim()) {
        throw new Error('The uploaded PDF did not return readable resume text.');
      }

      setStage('Generating your resume roast…');
      const roastResponse = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: uploadData.text }),
      });
      const roastData = await readResponse(roastResponse, 'Unable to generate your roast.');

      if (!roastData?.success || !isRoastResult(roastData.roast)) {
        throw new Error('The roast response had an unexpected format. Please try again.');
      }

      setRoast(roastData.roast);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong. Please try again.');
    } finally {
      setStage('');
    }
  }

  function resetRoast() {
    setFile(null);
    setRoast(null);
    setError('');
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center" role="status">
          <p className="text-slate-600">{status === 'loading' ? 'Checking your session…' : 'Redirecting to sign in…'}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header user={session.user} onSignOut={() => signOut({ callbackUrl: '/' })} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {!roast ? (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Step 1 of 1</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Upload your resume</h1>
            <p className="mt-3 leading-7 text-slate-600">We’ll extract the text, then return an honest and actionable roast.</p>
            <form className="mt-7" onSubmit={submitResume}>
              <UploadDropzone file={file} onFileSelect={selectFile} disabled={isLoading} />
              {error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}
              {isLoading && <p className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm font-medium text-indigo-700" role="status">{stage}</p>}
              <button
                type="submit"
                disabled={!file || isLoading}
                className="mt-6 w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isLoading ? 'Working on it…' : 'Roast my resume'}
              </button>
            </form>
          </section>
        ) : (
          <section>
            <div className="rounded-2xl bg-indigo-700 p-6 text-white shadow-sm sm:flex sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-indigo-200">Your resume roast</p>
                <h1 className="mt-2 text-3xl font-bold">The verdict is in.</h1>
              </div>
              <div className="mt-5 sm:mt-0"><ScoreCircle score={roast.overallScore} /></div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold">What needs work</h2>
              <div className="mt-4 space-y-4">
                {roast.roasts.map((item, index) => <FeedbackCard key={`${item.title}-${index}`} roast={item} />)}
              </div>
            </div>

            <section className="mt-8 rounded-xl border border-emerald-100 bg-emerald-50 p-5">
              <h2 className="text-xl font-bold text-emerald-950">How to improve it</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-emerald-900">
                {roast.suggestions.map((suggestion, index) => <li key={`${suggestion}-${index}`}>{suggestion}</li>)}
              </ul>
            </section>

            <button
              type="button"
              onClick={resetRoast}
              className="mt-8 w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
            >
              Roast another resume
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
