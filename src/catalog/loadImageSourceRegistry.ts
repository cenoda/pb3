import type { ImageSourceRegistryFile } from "../contract/cat6";
import { CAT6_IMAGE_SOURCE_REGISTRY_PATH } from "../contract/cat6";
import { imageSourceRegistryFileSchema } from "../contract/cat6.schema";

export async function loadImageSourceRegistry(): Promise<ImageSourceRegistryFile> {
  const response = await fetch(CAT6_IMAGE_SOURCE_REGISTRY_PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load image source registry at ${CAT6_IMAGE_SOURCE_REGISTRY_PATH}: HTTP ${response.status}`,
    );
  }

  const json: unknown = await response.json();
  const parsed = imageSourceRegistryFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid image source registry at ${CAT6_IMAGE_SOURCE_REGISTRY_PATH}: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}
