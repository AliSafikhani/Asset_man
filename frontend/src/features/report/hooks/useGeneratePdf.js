/**
 * useGeneratePdf — capture each page ref to a canvas and assemble a PDF.
 * File: frontend/src/features/report/hooks/useGeneratePdf.js
 *
 * jsPDF + html2canvas-pro are dynamically imported so they code-split out of
 * the main bundle. Each A4 node is captured at 2× and placed as a full-page
 * PNG; canvases are zeroed after use to keep peak memory low.
 */

import { useState, useCallback } from 'react';
import { PAGE_W_PX, PAGE_H_PX, CAPTURE_SCALE } from '../reportTheme';

// A4 in millimetres (jsPDF unit).
const A4_W_MM = 210;
const A4_H_MM = 297;

export default function useGeneratePdf() {
  const [generating, setGenerating] = useState(false);

  const generate = useCallback(async (pageNodes, fileName) => {
    const nodes = (pageNodes || []).filter(Boolean);
    if (!nodes.length) throw new Error('No report pages to capture.');

    setGenerating(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas-pro'),
      ]);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      for (let i = 0; i < nodes.length; i++) {
        const canvas = await html2canvas(nodes[i], {
          scale: CAPTURE_SCALE,
          backgroundColor: '#ffffff',
          width: PAGE_W_PX,
          height: PAGE_H_PX,
          windowWidth: PAGE_W_PX,
          windowHeight: PAGE_H_PX,
          useCORS: true,
          logging: false,
        });

        const img = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage();
        pdf.addImage(img, 'PNG', 0, 0, A4_W_MM, A4_H_MM, undefined, 'FAST');

        // Free the canvas backing store before the next page.
        canvas.width = 0;
        canvas.height = 0;
      }

      pdf.save(fileName || 'Transformer_Report.pdf');
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generate, generating };
}
