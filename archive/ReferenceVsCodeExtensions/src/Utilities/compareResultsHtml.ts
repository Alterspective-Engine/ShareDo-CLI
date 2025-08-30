/**
 * Generates HTML for the compare results webview.
 */
export function getCompareResultsHtml(
  results: any[],
  sourceLabel: string,
  sourceUrl: string,
  sourceClient: any,
  compareServers: any[]
): string {
  if (!results || results.length === 0) {
    return `<html><body><h2>No differences found.</h2></body></html>`;
  }
  let html = `<html><body><h2>Comparison Results for <span style='color:#007acc'>${escapeHtml(sourceLabel)}</span></h2>`;
  html += `<div style='margin-bottom:1em;'><b>Selected (Source) Server:</b> <span style='color:#007acc'>${escapeHtml(sourceUrl)}</span></div>`;
  html += `<div style='margin-bottom:1em;'><b>Compared Servers:</b> `;
  html += compareServers.map(s => `<span style='color:#007acc'>${escapeHtml(s.url)}</span>`).join(', ');
  html += `</div>`;
  html += `<table border='1' cellpadding='6' style='border-collapse:collapse;'>`;
  html += `<tr><th>Compared Server</th><th>Difference Path</th><th>Value on <span style='color:#007acc'>${escapeHtml(sourceUrl)}</span></th><th>Value on Compared Server</th></tr>`;
  html += results.map(r =>
    r.differences && r.differences.length > 0
      ? r.differences.map((diff: any) =>
          `<tr>
            <td>${escapeHtml(r.server)}</td>
            <td>${escapeHtml(diff.path ? diff.path.join('.') : '')}</td>
            <td>${escapeHtml(JSON.stringify(diff.a, null, 2))}</td>
            <td>${escapeHtml(JSON.stringify(diff.b, null, 2))}</td>
          </tr>`
        ).join('')
      : `<tr><td>${escapeHtml(r.server)}</td><td colspan='3'>No differences</td></tr>`
  ).join('');
  html += `</table></body></html>`;
  return html;
}

/**
 * Escapes HTML special characters in a string.
 */
function escapeHtml(text: string): string {
  return String(text).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c]||c));
}
