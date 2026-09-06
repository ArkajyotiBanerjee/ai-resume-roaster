export default function ScoreCircle({ score }) {
  const safeScore = Math.round(score);
  const scoreColor = safeScore >= 75 ? 'text-emerald-600' : safeScore >= 50 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-8 border-slate-100 bg-white shadow-sm">
      <span className={`text-3xl font-bold ${scoreColor}`}>{safeScore}</span>
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Score</span>
    </div>
  );
}
