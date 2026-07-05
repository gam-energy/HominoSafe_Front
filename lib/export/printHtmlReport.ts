/** Print HTML using a hidden iframe (more reliable than window.open + onload). */
export function printHtmlReport(html: string): void {
  if (typeof document === 'undefined') {
    throw new Error('Print is only available in the browser');
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Report print');
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

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
    } finally {
      window.setTimeout(cleanup, 1500);
    }
  };

  // onload is unreliable after document.write; short delay lets layout settle.
  window.setTimeout(triggerPrint, 400);
}
