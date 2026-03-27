import Link from 'next/link';

export default function BrandSignature({
  href = '/',
  subtitle = '',
  compact = false,
  className = '',
  tone = 'default',
}) {
  const warm = tone === 'warm';

  return (
    <Link href={href} className={`flex items-center gap-3 text-white ${className}`}>
      <span
        className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border ${
          warm
            ? 'border-white/12 bg-[linear-gradient(180deg,rgba(28,20,15,0.96),rgba(14,11,9,0.94))] shadow-[0_12px_28px_rgba(255,138,60,0.1)]'
            : 'border-white/10 bg-white/[0.03]'
        }`}
      >
        {warm ? (
          <>
            <span className="absolute inset-[7px] rotate-45 rounded-[5px] border border-[#ffcf9a]/18 bg-[linear-gradient(180deg,rgba(255,179,107,0.12),rgba(180,83,9,0.04))]" />
            <span className="relative h-2.5 w-2.5 rotate-45 rounded-[3px] bg-[#ffb36b] shadow-[0_0_14px_rgba(255,138,60,0.22)]" />
            <span className="absolute bottom-[7px] right-[7px] h-1 w-1 rounded-full bg-[#ffd8b2]" />
          </>
        ) : (
          <span className="h-2 w-2 rounded-full bg-emerald-200" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold tracking-[-0.01em] text-white">
          ShadowBook
        </span>
        {subtitle ? (
          <span className={`block text-[#8f7f71] ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
