import { describe, it, expect } from 'vitest';
import { aliceRound1, aliceRound3, bobRound2, runPSI, tracePSI, verifyCorrectness } from '../src/psi.js';
import {
  oprfAliceRound1,
  oprfAliceRound3,
  oprfBobRound2,
  oprfBobSetup,
  runOPRFPSI,
} from '../src/oprf-psi.js';
import {
  InvalidPointError,
  hashToPoint,
  randomScalar,
  scalarFromSeed,
  pointToHex,
} from '../src/group.js';

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

/**
 * Every point that crosses the wire is attacker-controlled and must be
 * validated by the receiving round before a scalar touches it. These tests
 * exercise each receive point with the encoding that matters most — the
 * identity, which decodes perfectly well and would collapse every output to O.
 * If validation is ever dropped from one of these paths, exactly one of these
 * stops throwing.
 */
describe('received-point validation on the protocol path', () => {
  const IDENTITY = new Uint8Array(32); // canonical ristretto encoding of O
  const NON_CANONICAL = (() => {
    const b = new Uint8Array(32);
    b[31] = 0x80; // high bit set — never a valid ristretto encoding
    return b;
  })();

  it('bobRound2 rejects the identity injected as X_i', () => {
    expect(() => bobRound2({ blindedElements: [IDENTITY] }, ['b'])).toThrow(InvalidPointError);
  });

  it('bobRound2 rejects a non-canonical encoding injected as X_i', () => {
    expect(() => bobRound2({ blindedElements: [NON_CANONICAL] }, ['b'])).toThrow(
      InvalidPointError
    );
  });

  it('bobRound2 rejects a bad X_i hidden among honest ones, and names its index', () => {
    const honest = aliceRound1(['a', 'b', 'c']);
    const tampered = [...honest.blindedElements];
    tampered[1] = IDENTITY;
    try {
      bobRound2({ blindedElements: tampered }, ['b']);
      throw new Error('expected bobRound2 to abort');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidPointError);
      expect((err as InvalidPointError).index).toBe(1);
    }
  });

  it('aliceRound3 rejects a malicious Y_i or Z_j from Bob', () => {
    const A = ['alice', 'bob'];
    const B = ['bob', 'eve'];
    const r1 = aliceRound1(A);
    const r2 = bobRound2(r1, B);

    const badY = { ...r2, doubleBlindedAliceElements: [IDENTITY, IDENTITY] };
    expect(() => aliceRound3(r1, badY, A)).toThrow(InvalidPointError);

    const badZ = { ...r2, bobBlindedElements: [IDENTITY, ...r2.bobBlindedElements.slice(1)] };
    expect(() => aliceRound3(r1, badZ, A)).toThrow(InvalidPointError);
  });

  it('the OPRF server refuses to evaluate an invalid query', () => {
    const bob = oprfBobSetup(['b']);
    expect(() => oprfBobRound2({ aliceScalar: randomScalar(), blindedElements: [IDENTITY] }, bob.bobKey))
      .toThrow(InvalidPointError);
  });

  it('the OPRF client refuses to unblind an invalid evaluation', () => {
    const A = ['a'];
    const bob = oprfBobSetup(['a']);
    const q = oprfAliceRound1(A);
    expect(() =>
      oprfAliceRound3(A, q, { evaluatedElements: [IDENTITY] }, bob.publishedSet)
    ).toThrow(InvalidPointError);
  });

  it('validation does not reject honest traffic — full runs still succeed', () => {
    const A = ['alice@example.com', 'bob@example.com'];
    const B = ['bob@example.com', 'eve@example.com'];
    expect(runPSI(A, B).intersection).toEqual(['bob@example.com']);
    expect(runOPRFPSI(A, B).intersection).toEqual(['bob@example.com']);
    // And an honestly hashed-and-blinded point is accepted on the receive path.
    expect(() =>
      bobRound2({ blindedElements: [hashToPoint('honest')] }, ['b'])
    ).not.toThrow();
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
