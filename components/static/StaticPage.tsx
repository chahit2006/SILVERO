export function StaticPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 lg:px-8">
      <h1 className="font-display text-3xl">{title}</h1>
      {updated && <p className="mt-2 text-xs uppercase tracking-wide text-text-dark/40">Last updated {updated}</p>}
      <div className="prose-static mt-8 space-y-5 text-sm leading-relaxed text-text-dark/75">{children}</div>
    </div>
  );
}
