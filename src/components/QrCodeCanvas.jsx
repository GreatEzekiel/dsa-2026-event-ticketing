import React, { useEffect, useRef } from 'react';

function buildQrMatrix(text, size = 21) {
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0, c0) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r;
        const cc = c0 + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const onBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const onCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[rr][cc] = onBorder || onCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  let hash = 2166136261;
  for (let idx = 0; idx < text.length; idx++) {
    hash ^= text.charCodeAt(idx);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      const charCode = text.length > 0 ? text.charCodeAt((r * size + c) % text.length) : 1;
      hash ^= r * 31 + c * 17 + charCode;
      hash = Math.imul(hash, 16777619);
      matrix[r][c] = ((hash >>> ((r + c) % 24)) & 1) === 1;
    }
  }

  return matrix;
}

export default function QrCodeCanvas({ value, size = 148 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const modules = 21;
    const scale = Math.floor(size / modules);
    const dim = modules * scale;

    canvas.width = dim;
    canvas.height = dim;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, dim, dim);

    const matrix = buildQrMatrix(String(value || ''), modules);
    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (matrix[r][c]) {
          ctx.fillRect(c * scale, r * scale, scale, scale);
        }
      }
    }
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Ticket QR Code"
      className="border border-slate-200 rounded bg-white p-1.5"
    />
  );
}