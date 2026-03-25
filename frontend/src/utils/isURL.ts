/**
 * Checks if a string is a valid HTTP or HTTPS URL.
 */
export function isURL(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
