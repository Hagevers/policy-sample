import iconv from "iconv-lite";

export function fixEncoding(text: string): string {
  // First, try to decode as Windows-1255 (common for Hebrew)
  const windows1255 = iconv.decode(Buffer.from(text, "binary"), "windows-1255");

  // If the result looks good (contains Hebrew characters), return it
  if (/[\u0590-\u05FF]/.test(windows1255)) {
    return windows1255;
  }

  // If Windows-1255 didn't work, try ISO-8859-8
  const iso88598 = iconv.decode(Buffer.from(text, "binary"), "iso-8859-8");

  // If the result looks good, return it
  if (/[\u0590-\u05FF]/.test(iso88598)) {
    return iso88598;
  }

  // If none of the above worked, return the original text
  return text;
}
