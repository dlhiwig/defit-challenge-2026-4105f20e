/**
 * Copy the current view URL (path + query) to the clipboard so a user can
 * share the exact filters/sort/page they are looking at.
 * Falls back to a hidden textarea when the async clipboard API is blocked.
 */
export async function copyCurrentViewLink(): Promise<string | null> {
  const url = window.location.href;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return url;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const area = document.createElement('textarea');
    area.value = url;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok ? url : null;
  } catch {
    return null;
  }
}
