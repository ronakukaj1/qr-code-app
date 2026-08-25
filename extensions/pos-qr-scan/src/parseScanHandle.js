const APP_PROXY_PATH_PATTERN = /\/apps\/[^/]+\/([^/?#]+)/;

/**
 * @param {string | undefined} scanData
 * @returns {string | null}
 */
export function parseScanHandle(scanData) {
  if (!scanData?.trim()) {
    return null;
  }

  const trimmed = scanData.trim();

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(APP_PROXY_PATH_PATTERN);

    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch {
    // Not a URL — fall through to handle-only scans.
  }

  if (/^[a-z0-9-]+$/i.test(trimmed)) {
    return trimmed;
  }

  return null;
}
