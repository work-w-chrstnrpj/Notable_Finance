import { toPng } from "html-to-image";

/**
 * Nodes carrying this class (interactive chrome: view switchers, filters,
 * action buttons) are dropped from an exported/captured snapshot so the shot
 * shows only headers and data.
 */
export const SHOT_HIDE_CLASS = "fab-shot-hide";

function shouldKeepNode(node: HTMLElement): boolean {
  if (node.nodeType !== 1) return true;
  if (node.classList?.contains(SHOT_HIDE_CLASS)) return false;
  return true;
}

/**
 * Render a DOM node to a high-resolution PNG data URL.
 *
 * Web fonts are awaited first, and the node is rendered twice: html-to-image's
 * first pass frequently misses freshly-embedded fonts/images (producing a blank
 * or half-styled image), and the second pass renders reliably from the now-warm
 * resource cache.
 */
export async function nodeToPngDataUrl(node: HTMLElement): Promise<string> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* fonts API unavailable — continue */
    }
  }

  const options = {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: "#ffffff",
    // Capture the full laid-out size so nothing is clipped by scroll overflow.
    width: node.scrollWidth,
    height: node.scrollHeight,
    filter: shouldKeepNode,
  };

  await toPng(node, options); // warm-up pass
  return toPng(node, options);
}

/** Render a DOM node to PNG and trigger a browser download. */
export async function downloadNodeAsPng(
  node: HTMLElement,
  filename: string,
): Promise<void> {
  const dataUrl = await nodeToPngDataUrl(node);
  const link = document.createElement("a");
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * Open the browser print dialog scoped to a single node ("like Chrome print",
 * where the user can pick a printer or Save as PDF).
 *
 * A *clone* of the node is appended to <body> inside a `.print-root` wrapper and
 * every other body child is `display: none`-d for print (see globals.css). This
 * collapses the document to exactly the surface's height — one page — and avoids
 * the `position: fixed` "repeats on every page" bug that produced duplicate
 * pages. The live React tree is never touched, so state is preserved.
 */
export function printNode(node: HTMLElement): void {
  const printRoot = document.createElement("div");
  printRoot.className = "print-root";

  const clone = node.cloneNode(true) as HTMLElement;
  clone.removeAttribute("data-print-surface");
  printRoot.appendChild(clone);
  document.body.appendChild(printRoot);
  document.body.classList.add("is-printing");

  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    document.body.classList.remove("is-printing");
    printRoot.remove();
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);
  // Fallback in case afterprint never fires (e.g. print cancelled in some
  // browsers). Long enough not to yank the surface mid-dialog.
  window.setTimeout(cleanup, 60_000);
  window.print();
}
