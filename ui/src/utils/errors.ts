export interface FriendlyError {
  title: string;
  message: string;
}

/**
 * Our own controller returns short, human-written strings for expected failures
 * (e.g. "That file doesn't match what this tool expects.") - those are safe to
 * show as-is. Everything else (network failures, HTML error pages, stack traces
 * that slipped through) gets replaced with generic, calm copy instead of shown
 * verbatim. Never show a raw backend/network error to a user.
 */
export const toFriendlyError = (raw: string): FriendlyError => {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes('timed out') || lower.includes('network error') || lower.includes('failed to fetch')) {
    return {
      title: 'Connection lost',
      message: 'Check your connection and try again.',
    };
  }

  const looksRaw =
    trimmed.startsWith('<') ||
    trimmed.includes('Exception') ||
    trimmed.includes('   at ') ||
    trimmed.includes('{') ||
    trimmed.length > 160 ||
    trimmed.length === 0;

  if (looksRaw) {
    return {
      title: 'Something went wrong',
      message: "We couldn't process this file. Please try again.",
    };
  }

  return {
    title: 'That didn\u2019t work',
    message: trimmed,
  };
};