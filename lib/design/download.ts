/**
 * Fetch a CSV endpoint and trigger a browser file download. Returns the
 * filename used (parsed from the Content-Disposition header, else the
 * fallback). Throws an Error with a friendly message on a non-OK response.
 */
export async function downloadCsv(url: string, fallbackName: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename = match?.[1] ?? fallbackName;
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
  return filename;
}
