export default function FeedbackCard({ roast }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{roast.title}</h3>
      <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">{roast.comment}</p>
    </article>
  );
}
