/**
 * Resolve extensionless relative specifiers to `.ts` for the ingest CLI.
 * Vitest already does this for `pnpm test`; Node type-stripping does not.
 */
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    const parent = context.parentURL ?? "";
    const fromRepo =
      parent.includes("/src/") ||
      parent.includes("/scripts/ingest/") ||
      specifier.startsWith("../") ||
      specifier.startsWith("./");
    if (!fromRepo || specifier.includes("node_modules") || specifier.startsWith("node:")) {
      throw err;
    }
    if (specifier.endsWith(".ts") || specifier.endsWith(".json")) {
      throw err;
    }
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      throw err;
    }
  }
}
