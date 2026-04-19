/**
 * PdfViewer (Web / PWA uniquement)
 *
 * Rend chaque page du PDF sur un <canvas> via PDF.js.
 * Avantages vs <embed> :
 *  - Aucun bouton de téléchargement natif du navigateur
 *  - Clic-droit désactivé sur les canvas
 *  - user-select: none → pas de sélection/copie de texte
 *  - Rendu lazy par page (IntersectionObserver) → rapide même pour de gros fichiers
 *  - Zoom +/− personnalisé
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Worker CDN — correspond exactement à la version installée (3.11.174)
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

// ─── CSS injecté une seule fois ───────────────────────────────────────────────
const STYLES = `
.pdv-root {
  display: flex; flex-direction: column; height: 100%; overflow: hidden;
  background: #525659; font-family: system-ui, sans-serif;
}
.pdv-bar {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  padding: 8px 16px; background: #3d3d3d; color: #fff; font-size: 13px;
  flex-shrink: 0; user-select: none; -webkit-user-select: none;
}
.pdv-btn {
  background: rgba(255,255,255,0.15); border: none; border-radius: 6px;
  color: #fff; font-size: 20px; width: 34px; height: 34px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; line-height: 1;
}
.pdv-btn:hover { background: rgba(255,255,255,0.28); }
.pdv-btn:active { background: rgba(255,255,255,0.1); }
.pdv-pages {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.pdv-page {
  box-shadow: 0 3px 14px rgba(0,0,0,0.55); background: #fff;
  user-select: none; -webkit-user-select: none; -moz-user-select: none;
  position: relative; overflow: hidden;
}
.pdv-page canvas { display: block; max-width: 100%; height: auto; }
.pdv-placeholder {
  background: #d0d0d0; display: flex; align-items: center; justify-content: center;
  color: #888; font-size: 13px;
}
.pdv-info { color: rgba(255,255,255,0.55); margin-left: 12px; font-size: 12px; }
`;

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('pdv-styles')) return;
  const tag = document.createElement('style');
  tag.id = 'pdv-styles';
  tag.textContent = STYLES;
  document.head.appendChild(tag);
}

// ─── PdfPage — une page rendue en canvas ──────────────────────────────────────
interface PageProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  containerWidth: number;
}

function PdfPage({ pdf, pageNumber, scale, containerWidth }: PageProps) {
  const wrapperRef  = useRef<HTMLDivElement | null>(null);
  const canvasRef   = useRef<HTMLCanvasElement | null>(null);
  const renderRef   = useRef<any>(null);
  const [visible,     setVisible]     = useState(false);
  const [dimensions,  setDimensions]  = useState<{ w: number; h: number } | null>(null);

  // Calcul des dimensions placeholder sans render
  useEffect(() => {
    let cancelled = false;
    pdf.getPage(pageNumber).then((page) => {
      if (cancelled) return;
      const vp = page.getViewport({ scale });
      const ratio = vp.width > 0 ? vp.height / vp.width : 1.414;
      const w = Math.min(containerWidth - 32, vp.width);
      setDimensions({ w, h: Math.round(w * ratio) });
    });
    return () => { cancelled = true; };
  }, [pdf, pageNumber, scale, containerWidth]);

  // Observer de visibilité (lazy render)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: '400px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Rendu effectif
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    (async () => {
      const page = await pdf.getPage(pageNumber);
      const vp   = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width  = vp.width  * dpr;
      canvas.height = vp.height * dpr;
      const displayW = Math.min(containerWidth - 32, vp.width);
      canvas.style.width  = `${displayW}px`;
      canvas.style.height = `${Math.round(displayW * (vp.height / vp.width))}px`;
      ctx.scale(dpr, dpr);

      renderRef.current?.cancel();
      renderRef.current = page.render({ canvasContext: ctx, viewport: vp });
      try { await renderRef.current.promise; } catch { /* annulé */ }
    })();

    return () => {
      cancelled = true;
      renderRef.current?.cancel();
    };
  }, [pdf, pageNumber, scale, visible, containerWidth]);

  const noCtxMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), []);

  return (
    <div
      ref={wrapperRef}
      className="pdv-page"
      onContextMenu={noCtxMenu}
      style={dimensions
        ? { width: dimensions.w, minHeight: dimensions.h }
        : { width: Math.min(containerWidth - 32, 600), minHeight: 400 }}
    >
      {visible
        ? <canvas ref={canvasRef} />
        : <div
            className="pdv-placeholder"
            style={dimensions
              ? { width: dimensions.w, height: dimensions.h }
              : { width: '100%', height: 400 }}
          >
            {pageNumber}
          </div>
      }
    </div>
  );
}

// ─── PdfViewer ────────────────────────────────────────────────────────────────
export interface PdfViewerProps {
  /** ArrayBuffer du PDF déjà chargé (avec auth côté appelant). */
  pdfData: ArrayBuffer;
}

export function PdfViewer({ pdfData }: PdfViewerProps) {
  const [pdf,      setPdf]      = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [scale,    setScale]    = useState(1.5);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const pagesRef     = useRef<HTMLDivElement | null>(null);
  const [ctrWidth,   setCtrWidth]   = useState(640);

  injectStyles();

  // Largeur conteneur (pour adapter les canvas)
  useEffect(() => {
    const el = pagesRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setCtrWidth(e.contentRect.width));
    obs.observe(el);
    setCtrWidth(el.clientWidth || 640);
    return () => obs.disconnect();
  }, []);

  // Chargement du document
  useEffect(() => {
    if (!pdfData || pdfData.byteLength === 0) return;
    setLoading(true);
    setError(null);
    setPdf(null);
    setNumPages(0);
    // Copier le buffer pour éviter "detached ArrayBuffer"
    const copy = pdfData.slice(0);
    const task = pdfjsLib.getDocument({ data: copy });
    task.promise.then(
      (doc) => { setPdf(doc); setNumPages(doc.numPages); setLoading(false); },
      (err) => { setError(err?.message ?? 'Impossible de charger le PDF'); setLoading(false); },
    );
    return () => { task.destroy(); };
  }, [pdfData]);

  const zoomOut = () => setScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)));
  const zoomIn  = () => setScale((s) => Math.min(3.0, +(s + 0.25).toFixed(2)));

  return (
    <div className="pdv-root">
      {/* Barre de contrôle */}
      <div className="pdv-bar">
        <button className="pdv-btn" onClick={zoomOut} title="Zoom −">−</button>
        <span>{Math.round(scale * 100)} %</span>
        <button className="pdv-btn" onClick={zoomIn}  title="Zoom +">+</button>
        {numPages > 0 && (
          <span className="pdv-info">{numPages} page{numPages > 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Pages */}
      <div className="pdv-pages" ref={pagesRef}>
        {loading && (
          <p style={{ color: '#fff', marginTop: 48 }}>Chargement du document…</p>
        )}
        {error && (
          <p style={{ color: '#ff6b6b', marginTop: 48, textAlign: 'center', padding: '0 24px' }}>
            {error}
          </p>
        )}
        {!loading && !error && pdf && Array.from({ length: numPages }, (_, i) => (
          <PdfPage
            key={`p${i + 1}-s${scale}`}
            pdf={pdf}
            pageNumber={i + 1}
            scale={scale}
            containerWidth={ctrWidth}
          />
        ))}
      </div>
    </div>
  );
}
