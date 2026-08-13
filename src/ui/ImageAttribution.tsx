import type { ImageSourceRegistryEntry } from "../contract/cat6";

export interface ImageAttributionProps {
  source: ImageSourceRegistryEntry;
}

export function licenseShortLabel(source: ImageSourceRegistryEntry): string {
  const text = `${source.verbatimTerms} ${source.notes ?? ""}`;
  if (/CC BY-SA/i.test(text)) return "CC BY-SA";
  if (/CC BY/i.test(text)) return "CC BY";
  if (/Free Art|Licence Art Libre|\bFAL\b/i.test(text)) return "FAL";
  return "CC";
}

/** Inline one-line credit for cc-attribution images only (O3 / RK3). */
export function ImageAttribution({ source }: ImageAttributionProps) {
  if (source.rightsClass !== "cc-attribution") {
    return null;
  }

  return (
    <p className="image-attribution" data-testid="image-attribution">
      {source.publisher} · {licenseShortLabel(source)} ·{" "}
      <a
        href={source.canonicalUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
      >
        source
      </a>
    </p>
  );
}
