import { Heart, Camera } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { INSTAGRAM_TILES, INSTAGRAM_SECTION } from "@/content/homepage";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";

const TILE_TONES = [
  "var(--color-bloom-tint)",
  "var(--color-denim-tint)",
  "var(--color-beige)",
];

const DEFAULT_SETTINGS = { padding: "lg", background: "transparent", width: "default", align: "center" } as const;

export function InstagramGallery({ title, subtitle, settings }: SectionOverrideProps) {
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);

  return (
    <section className={cn("mx-auto px-4 sm:px-6 lg:px-8", paddingClass(s), backgroundClass(s), widthClass(s))}>
      <SectionHeading
        eyebrow={INSTAGRAM_SECTION.eyebrow}
        title={title ?? INSTAGRAM_SECTION.title}
        description={subtitle ?? INSTAGRAM_SECTION.description}
        align={s.align}
      />

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {INSTAGRAM_TILES.map((tile, i) => (
          <a
            key={tile.id}
            href="#"
            className="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-lg p-3 transition-transform duration-300 ease-out hover:-translate-y-1"
            style={{ backgroundColor: TILE_TONES[i % TILE_TONES.length] }}
          >
            <Camera
              className="absolute right-3 top-3 text-ink/30"
              size={18}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p className="line-clamp-2 text-xs font-semibold text-ink/80">{tile.caption}</p>
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-ink/60">
              <Heart size={12} className="fill-bloom text-bloom" />
              {tile.likes}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
