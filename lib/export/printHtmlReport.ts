/** Print HTML using a hidden iframe (more reliable than window.open + onload). */
export function printHtmlReport(html: string): void {
  if (typeof document === 'undefined') {
    throw new Error('Print is only available in the browser');
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Report print');
  // Non-zero size + offscreen: zero-size iframes often cannot print.
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '800px';
  iframe.style.height = '1100px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-1';

  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument ?? win?.document;

  if (!win || !doc) {
    document.body.removeChild(iframe);
    throw new Error('Could not initialize print view');
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  const triggerPrint = () => {
    try {
      win.focus();
      win.print();
    } catch (err) {
      cleanup();
      throw err instanceof Error ? err : new Error('Print failed');
    } finally {
      window.setTimeout(cleanup, 2000);
    }
  };

  // Wait for styles/layout; onload is unreliable after document.write.
  window.setTimeout(triggerPrint, 500);
}

/** Download HTML as a PDF-friendly file when print is unavailable. */
export function downloadHtmlFile(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
