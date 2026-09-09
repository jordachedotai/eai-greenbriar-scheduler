// Company logo on a white tile so dark logos read on the panel background.
// Sizes from reference/design: 84 by 52 in rows, 56 by 40 on cards.

export function LogoTile({ src, name, width = 84, height = 52, radius = 10 }: { src?: string; name: string; width?: number; height?: number; radius?: number }) {
  return (
    <span
      style={{ width, height, borderRadius: radius, padding: Math.round(height / 9) }}
      className="flex shrink-0 items-center justify-center border border-[#e6ebe4] bg-white"
      data-testid="logo-tile"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="text-[12px] font-semibold text-mut">{name.slice(0, 2)}</span>
      )}
    </span>
  );
}
