export default function WorkspaceLoading({
  title = 'Loading workspace',
  description = 'Preparing the encrypted execution surface...',
}) {
  return (
    <section className="space-y-6">
      <div className="sb-card-primary space-y-4">
        <div>
          <p className="sb-eyebrow">Loading</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">{title}</h2>
        </div>
        <p className="text-sm leading-relaxed text-slate-400">{description}</p>
        <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.03]">
          <span className="block h-full w-1/3 rounded-full bg-[#ffb36b]/70" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <div className="sb-card-secondary h-[340px] animate-pulse" />
        <div className="space-y-6">
          <div className="sb-card-secondary h-[180px] animate-pulse" />
          <div className="sb-card-secondary h-[220px] animate-pulse" />
        </div>
      </div>
    </section>
  );
}
