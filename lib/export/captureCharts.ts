export type ChartCapture = {
  title: string;
  svgHtml: string;
};

function dedupeSvgIds(svg: SVGElement, suffix: string): void {
  const idMap = new Map<string, string>();

  svg.querySelectorAll('[id]').forEach((el) => {
    const oldId = el.getAttribute('id');
    if (!oldId) return;
    const newId = `${oldId}-${suffix}`;
    idMap.set(oldId, newId);
    el.setAttribute('id', newId);
  });

  svg.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (!attr.value.includes('url(#')) return;
      let next = attr.value;
      idMap.forEach((newId, oldId) => {
        next = next.replaceAll(`url(#${oldId})`, `url(#${newId})`);
      });
      if (next !== attr.value) {
        el.setAttribute(attr.name, next);
      }
    });
  });
}

function serializeSvg(svg: SVGElement, suffix: string): string {
  const clone = svg.cloneNode(true) as SVGElement;
  const rect = svg.getBoundingClientRect();
  const width = Math.max(Math.round(rect.width), 320);
  const height = Math.max(Math.round(rect.height), 120);

  dedupeSvgIds(clone, suffix);

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.style.maxWidth = '100%';
  clone.style.height = 'auto';

  return clone.outerHTML;
}

/** Capture Recharts (or any) SVGs marked with data-export-chart on the page. */
export function captureExportCharts(
  root: ParentNode = document
): ChartCapture[] {
  if (typeof document === 'undefined') return [];

  const nodes = root.querySelectorAll('[data-export-chart]');

  return Array.from(nodes)
    .map((node, index) => {
      const title =
        node.getAttribute('data-export-chart-title')?.trim() || 'Chart';
      const chartId =
        node.getAttribute('data-export-chart')?.trim() || `chart-${index}`;
      const svg =
        node.querySelector('svg.recharts-surface') ??
        node.querySelector('svg');

      if (!svg) return null;

      return {
        title,
        svgHtml: serializeSvg(svg, chartId.replace(/[^a-zA-Z0-9_-]/g, '-')),
      };
    })
    .filter((item): item is ChartCapture => item != null && !!item.svgHtml);
}
