// Login return paths stay inside the advisor workspace on this origin.
export function advisorReturnPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/.test(value)
  ) return "/advisor";
  try {
    const origin = "https://advisor.invalid";
    const url = new URL(value, origin);
    if (
      url.origin !== origin ||
      (url.pathname !== "/advisor" && !url.pathname.startsWith("/advisor/"))
    ) return "/advisor";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/advisor";
  }
}
