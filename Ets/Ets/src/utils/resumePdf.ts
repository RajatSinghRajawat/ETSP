import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const A4_WIDTH_PX = 794; // A4 width at 96dpi
const A4_HEIGHT_PX = 1123; // A4 height at 96dpi
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

function sanitizeFileName(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '') || 'candidate';
}

function waitForLoad(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise((resolve) => {
    if (iframe.contentDocument?.readyState === 'complete') {
      resolve();
      return;
    }
    const onLoad = () => {
      iframe.removeEventListener('load', onLoad);
      resolve();
    };
    iframe.addEventListener('load', onLoad);
    // Safety net so we don't hang forever if `load` never fires.
    setTimeout(resolve, 4000);
  });
}

async function waitForFonts(doc: Document): Promise<void> {
  try {
    const fonts = (doc as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    if (fonts?.ready) {
      await fonts.ready;
    }
  } catch {
    // ignore — font loading is best-effort
  }
}

async function waitForImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images || []);
  if (images.length === 0) return;
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => {
            img.removeEventListener('load', done);
            img.removeEventListener('error', done);
            resolve();
          };
          img.addEventListener('load', done);
          img.addEventListener('error', done);
          // Don't wait forever for any single image.
          setTimeout(done, 3000);
        }),
    ),
  );
}

// Renders the resume HTML inside a real off-screen iframe at A4 width, waits
// for fonts and images to load, then rasterises the iframe's body with
// html2canvas. The resulting bitmap is sliced into A4 pages via jsPDF, so a
// long resume produces a multi-page PDF instead of a single squashed image.
export async function downloadResumeHtmlAsPdf(htmlContent: string, fileBaseName: string) {
  if (!htmlContent) {
    throw new Error('No resume content to download');
  }

  const fileName = `${sanitizeFileName(fileBaseName)}_resume.pdf`;

  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${A4_WIDTH_PX}px`,
    // Start with a generous height; we resize once the content lays out.
    height: `${A4_HEIGHT_PX}px`,
    border: '0',
    background: '#ffffff',
    overflow: 'hidden',
    visibility: 'hidden',
  });
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  try {
    const idoc = iframe.contentDocument;
    const iwin = iframe.contentWindow;
    if (!idoc || !iwin) {
      throw new Error('Could not initialise the rendering frame');
    }

    idoc.open();
    idoc.write(htmlContent);
    idoc.close();

    await waitForLoad(iframe);
    await waitForFonts(idoc);
    await waitForImages(idoc);
    // Final settle for any layout/animation work the resume CSS may do.
    await new Promise((r) => setTimeout(r, 600));

    // Resize the iframe to fit the actual content height so html2canvas can
    // paint everything in one capture.
    const contentHeight = Math.max(
      idoc.body.scrollHeight,
      idoc.documentElement.scrollHeight,
      A4_HEIGHT_PX,
    );
    iframe.style.height = `${contentHeight}px`;
    await new Promise((r) => setTimeout(r, 100));

    const canvas = await html2canvas(idoc.body, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: A4_WIDTH_PX,
      height: contentHeight,
      windowWidth: A4_WIDTH_PX,
      windowHeight: contentHeight,
    });

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pdfPageWidthMm = A4_WIDTH_MM;
    const pdfPageHeightMm = A4_HEIGHT_MM;

    // Pixel height of one A4 page at the captured canvas scale.
    const pageCanvasHeightPx = Math.floor((canvas.width * A4_HEIGHT_PX) / A4_WIDTH_PX);
    const totalPages = Math.max(1, Math.ceil(canvas.height / pageCanvasHeightPx));

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
      const sliceY = pageIndex * pageCanvasHeightPx;
      const sliceHeight = Math.min(pageCanvasHeightPx, canvas.height - sliceY);

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not allocate canvas context for PDF page');
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(canvas, 0, sliceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

      const imageData = pageCanvas.toDataURL('image/jpeg', 0.96);
      const renderedHeightMm = (sliceHeight * pdfPageWidthMm) / canvas.width;

      if (pageIndex > 0) {
        pdf.addPage();
      }
      pdf.addImage(
        imageData,
        'JPEG',
        0,
        0,
        pdfPageWidthMm,
        Math.min(renderedHeightMm, pdfPageHeightMm),
        undefined,
        'FAST',
      );
    }

    pdf.save(fileName);
  } catch (error) {
    // Last-resort fallback: open the HTML in a new tab and trigger the browser
    // print dialog so the user can still save as PDF.
    try {
      const win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(htmlContent);
        win.document.close();
        win.addEventListener('load', () => setTimeout(() => win.print(), 500));
      }
    } catch {
      // ignore secondary failure
    }
    throw error instanceof Error ? error : new Error('PDF generation failed');
  } finally {
    iframe.remove();
  }
}
