import { describe, it, expect } from 'vitest';
import { runPSI, tracePSI, verifyCorrectness } from '../src/psi.js';
import { runOPRFPSI } from '../src/oprf-psi.js';
import { scalarFromSeed, pointToHex } from '../src/group.js';

/** Plaintext intersection — the ground truth that PSI must match. */
function plainIntersect(a: string[], b: string[]): string[] {
  const bs = new Set(b);
  return a.filter((x) => bs.has(x)).sort();
}

/** Random alphanumeric string. */
function randStr(len: number): string {
  const alpha = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
  return s;
}

function randomSet(size: number, lenPerEl = 6): string[] {
  const out = new Set<string>();
  while (out.size < size) out.add(randStr(lenPerEl));
  return [...out];
}

describe('DH-PSI correctness', () => {
  it('matches plaintext intersection on the canonical example', () => {
    const A = ['alice@example.com', 'bob@example.com', 'mom@example.com'];
    const B = ['bob@example.com', 'mom@example.com', 'eve@example.com'];
    const r = runPSI(A, B);
    expect(r.intersection.sort()).toEqual(plainIntersect(A, B));
  });

  it('returns empty intersection when sets are disjoint', () => {
    const A = ['a1', 'a2', 'a3'];
    const B = ['b1', 'b2', 'b3'];
    expect(runPSI(A, B).intersection).toEqual([]);
  });

  it('returns full intersection when sets are identical', () => {
    const items = ['x', 'y', 'z'];
    const r = runPSI(items, items);
    expect(r.intersection.sort()).toEqual([...items].sort());
  });

  it('property test: random A, B (≤30 each) — PSI === plaintext intersection', () => {
    for (let trial = 0; trial < 25; trial++) {
      const n = 1 + Math.floor(Math.random() * 30);
      const m = 1 + Math.floor(Math.random() * 30);
      const universe = randomSet(n + m + 5);
      const A = universe.slice(0, n);
      // Pick B with overlap drawn from A and fresh tail.
      const overlap = Math.floor(Math.random() * Math.min(n, m));
      const B = [...A.slice(0, overlap), ...universe.slice(n, n + (m - overlap))];
      const r = runPSI(A, B);
      const check = verifyCorrectness(A, B, r);
      expect(check.matches).toBe(true);
    }
  });
});

describe('tracePSI canonical test vector', () => {
  // Locked test vector. Any conforming implementation must reproduce this.
  // If this expectation ever changes, the published test vector has changed
  // and downstream implementers depending on it must be notified.
  const A = ['alice@example.com', 'bob@example.com', 'mom@example.com'];
  const B = ['bob@example.com', 'mom@example.com', 'eve@example.com'];
  const ALPHA = scalarFromSeed(
    '0000000000000000000000000000000000000000000000000000000000000007'
  );
  const BETA = scalarFromSeed(
    '000000000000000000000000000000000000000000000000000000000000000b'
  );

  it('computes the expected intersection', () => {
    const trace = tracePSI(A, B, ALPHA, BETA);
    expect(trace.intersection.sort()).toEqual(['bob@example.com', 'mom@example.com']);
  });

  it('Y_i = β·X_i (round 2 preserves Alice-side ordering)', () => {
    const trace = tracePSI(A, B, ALPHA, BETA);
    // For matched indices, Y_i must appear in W_j set.
    const wHex = new Set(trace.computedW.map(pointToHex));
    const matches = trace.wireB2A_Y
      .map((y, i) => (wHex.has(pointToHex(y)) ? A[i] : null))
      .filter((x): x is string => x !== null);
    expect(matches.sort()).toEqual(['bob@example.com', 'mom@example.com']);
  });

  it('αβ·H(b) is independent of the order operations are applied (commutativity)', () => {
    const trace = tracePSI(A, B, ALPHA, BETA);
    // Y_i corresponds to A[i]; for elements in the intersection, Y_i should
    // equal W_j for the matching b_j.
    // bob: A[1], B[0]; mom: A[2], B[1]
    expect(pointToHex(trace.wireB2A_Y[1]!)).toBe(pointToHex(trace.computedW[0]!));
    expect(pointToHex(trace.wireB2A_Y[2]!)).toBe(pointToHex(trace.computedW[1]!));
  });

  it('non-matching indices produce non-matching Y/W (no false positives)', () => {
    const trace = tracePSI(A, B, ALPHA, BETA);
    const wHex = new Set(trace.computedW.map(pointToHex));
    // A[0] = alice — not in B. Its Y must NOT appear in W.
    expect(wHex.has(pointToHex(trace.wireB2A_Y[0]!))).toBe(false);
  });
});

describe('OPRF-PSI correctness', () => {
  it('matches plaintext intersection on the canonical example', () => {
    const A = ['alice@example.com', 'bob@example.com', 'mom@example.com'];
    const B = ['bob@example.com', 'mom@example.com', 'eve@example.com'];
    const r = runOPRFPSI(A, B);
    expect(r.intersection.sort()).toEqual(plainIntersect(A, B));
  });

  it('property test: agrees with DH-PSI on random inputs', () => {
    for (let trial = 0; trial < 15; trial++) {
      const n = 1 + Math.floor(Math.random() * 20);
      const m = 1 + Math.floor(Math.random() * 20);
      const universe = randomSet(n + m + 5);
      const A = universe.slice(0, n);
      const overlap = Math.floor(Math.random() * Math.min(n, m));
      const B = [...A.slice(0, overlap), ...universe.slice(n, n + (m - overlap))];
      const dh = runPSI(A, B).intersection.sort();
      const oprf = runOPRFPSI(A, B).intersection.sort();
      expect(oprf).toEqual(dh);
    }
  });

  it('reveals only the PRF tag set size to Alice (not raw B)', () => {
    const A = ['x'];
    const B = ['a', 'b', 'c', 'd'];
    const r = runOPRFPSI(A, B);
    expect(r.aliceLearnedBobSize).toBe(4);
    expect(r.bobLearnedAliceSize).toBe(1);
  });
});
