/**
 * Web Worker host for heavy PSI workloads.
 *
 * Scalar multiplication on ristretto255 in JS is ~50–100 µs per op;
 * 10k elements end-to-end is ~2 seconds of CPU. Running that on the
 * main thread freezes the UI. The worker offloads it and reports back
 * once via postMessage.
 *
 * Wire format: { id, kind, payload } request → { id, ok, result|error } response.
 * Bytes (scalars / points) are serialised as 32-byte hex so they survive
 * structured cloning without ArrayBuffer ownership transfer concerns.
 */
/// <reference lib="webworker" />

import { runPSI } from './psi.js';
import { runOPRFPSI } from './oprf-psi.js';
import { hashToPoint, randomScalar, scalarMul, pointToHex } from './group.js';

type Request =
  | { id: number; kind: 'psi'; payload: { aliceSet: string[]; bobSet: string[] } }
  | { id: number; kind: 'oprf'; payload: { aliceSet: string[]; bobSet: string[] } }
  | { id: number; kind: 'bench-psi'; payload: { n: number; m: number; iter: number } }
  | { id: number; kind: 'bench-op'; payload: { op: 'hashToPoint' | 'scalarMul' | 'randomScalar'; iter: number } }
  | { id: number; kind: 'distribution'; payload: { count: number } };

type Response =
  | { id: number; ok: true; result: unknown }
  | { id: number; ok: false; error: string };

interface BenchResult {
  totalMs: number;
  perOpUs: number;
  opsPerSec: number;
  iter: number;
}

function bench(iter: number, fn: () => void): BenchResult {
  const warm = Math.min(50, Math.max(1, Math.floor(iter * 0.05)));
  for (let i = 0; i < warm; i++) fn();
  const t0 = performance.now();
  for (let i = 0; i < iter; i++) fn();
  const totalMs = performance.now() - t0;
  return {
    totalMs,
    perOpUs: (totalMs * 1000) / iter,
    opsPerSec: iter / (totalMs / 1000),
    iter,
  };
}

self.addEventListener('message', (e: MessageEvent<Request>) => {
  const req = e.data;
  const reply = (res: Response): void => (self as unknown as Worker).postMessage(res);
  try {
    switch (req.kind) {
      case 'psi': {
        const r = runPSI(req.payload.aliceSet, req.payload.bobSet);
        reply({ id: req.id, ok: true, result: r });
        return;
      }
      case 'oprf': {
        const r = runOPRFPSI(req.payload.aliceSet, req.payload.bobSet);
        reply({ id: req.id, ok: true, result: r });
        return;
      }
      case 'bench-psi': {
        const { n, m, iter } = req.payload;
        const a = Array.from({ length: n }, (_, i) => `alice-${i}@example.com`);
        const b = Array.from({ length: m }, (_, j) => `bob-${j}@example.com`);
        a[0] = b[0];
        if (a.length > 1 && b.length > 1) a[1] = b[1];
        const r = bench(iter, () => { runPSI(a, b); });
        reply({ id: req.id, ok: true, result: r });
        return;
      }
      case 'bench-op': {
        const { op, iter } = req.payload;
        const fixedPoint = hashToPoint('benchmark');
        const fixedScalar = randomScalar();
        const fn =
          op === 'hashToPoint'
            ? () => { hashToPoint('bench-' + Math.random()); }
            : op === 'scalarMul'
            ? () => { scalarMul(fixedScalar, fixedPoint); }
            : () => { randomScalar(); };
        const r = bench(iter, fn);
        reply({ id: req.id, ok: true, result: r });
        return;
      }
      case 'distribution': {
        // For the DDH-pseudorandomness viz: hash `count` distinct strings,
        // multiply by a fresh α, and bin every output byte 0..255.
        const alpha = randomScalar();
        const histogram = new Uint32Array(256);
        let totalBytes = 0;
        for (let i = 0; i < req.payload.count; i++) {
          const H = hashToPoint('ddh-bench-' + i);
          const Y = scalarMul(alpha, H);
          for (let j = 0; j < Y.length; j++) histogram[Y[j]]++;
          totalBytes += Y.length;
        }
        // Chi-square statistic against the uniform 1/256 expectation.
        const expected = totalBytes / 256;
        let chiSq = 0;
        for (let v = 0; v < 256; v++) {
          const diff = histogram[v] - expected;
          chiSq += (diff * diff) / expected;
        }
        const histArr: number[] = Array.from(histogram);
        reply({
          id: req.id,
          ok: true,
          result: {
            histogram: histArr,
            totalBytes,
            chiSq,
            df: 255,
            sampleAlphaHex: pointToHex(alpha),
            count: req.payload.count,
          },
        });
        return;
      }
    }
  } catch (err) {
    reply({ id: req.id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// Signal readiness so the host can resolve init promises.
(self as unknown as Worker).postMessage({ id: 0, ok: true, result: 'ready' });
