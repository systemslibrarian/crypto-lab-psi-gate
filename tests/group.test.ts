import { describe, it, expect } from 'vitest';
import {
  randomScalar,
  scalarFromSeed,
  scalarInverse,
  scalarMul,
  hashToPoint,
  pointToHex,
  pointEqual,
  isValidPoint,
} from '../src/group.js';

describe('group operations on ristretto255', () => {
  it('hashToPoint is deterministic per input', () => {
    const a = pointToHex(hashToPoint('alice@example.com'));
    const b = pointToHex(hashToPoint('alice@example.com'));
    expect(a).toBe(b);
  });

  it('hashToPoint distinguishes different inputs', () => {
    const a = pointToHex(hashToPoint('alice@example.com'));
    const b = pointToHex(hashToPoint('bob@example.com'));
    expect(a).not.toBe(b);
  });

  it('randomScalar returns a 32-byte non-zero scalar', () => {
    for (let i = 0; i < 50; i++) {
      const s = randomScalar();
      expect(s).toHaveLength(32);
      expect(s.some((b) => b !== 0)).toBe(true);
    }
  });

  it('scalarFromSeed is deterministic', () => {
    const s1 = pointToHex(scalarFromSeed('07'));
    const s2 = pointToHex(scalarFromSeed('07'));
    expect(s1).toBe(s2);
  });

  it('scalarFromSeed differs for different seeds', () => {
    const s1 = pointToHex(scalarFromSeed('07'));
    const s2 = pointToHex(scalarFromSeed('0b'));
    expect(s1).not.toBe(s2);
  });

  it('scalarInverse: α · α⁻¹ · P == P for random α and P', () => {
    for (let i = 0; i < 10; i++) {
      const alpha = randomScalar();
      const alphaInv = scalarInverse(alpha);
      const P = hashToPoint('inverse-test-' + i);
      const Q = scalarMul(alphaInv, scalarMul(alpha, P));
      expect(pointEqual(P, Q)).toBe(true);
    }
  });

  it('scalarMul is commutative across the protocol path: α(βP) == β(αP)', () => {
    const alpha = randomScalar();
    const beta = randomScalar();
    const P = hashToPoint('commutativity');
    const left = scalarMul(alpha, scalarMul(beta, P));
    const right = scalarMul(beta, scalarMul(alpha, P));
    expect(pointEqual(left, right)).toBe(true);
  });

  it('isValidPoint rejects identity, non-canonical, and torsion', () => {
    expect(isValidPoint(new Uint8Array(32))).toBe(false); // identity
    const nonCanon = new Uint8Array(32);
    nonCanon[31] = 0x80;
    expect(isValidPoint(nonCanon)).toBe(false);
    const torsion = new Uint8Array([
      0xec, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f,
    ]);
    expect(isValidPoint(torsion)).toBe(false);
  });

  it('isValidPoint accepts honestly-hashed points', () => {
    for (let i = 0; i < 20; i++) {
      const p = hashToPoint('valid-' + i);
      expect(isValidPoint(p)).toBe(true);
    }
  });

  it('isValidPoint rejects wrong-length buffers', () => {
    expect(isValidPoint(new Uint8Array(0))).toBe(false);
    expect(isValidPoint(new Uint8Array(31))).toBe(false);
    expect(isValidPoint(new Uint8Array(33))).toBe(false);
    expect(isValidPoint(new Uint8Array(64))).toBe(false);
  });

  it('scalarInverse: α⁻¹ · (α · P) == P for known α from seed', () => {
    // Deterministic round-trip — catches regressions in scalarInverse independent
    // of randomScalar quality.
    const alpha = scalarFromSeed('0000000000000000000000000000000000000000000000000000000000000007');
    const alphaInv = scalarInverse(alpha);
    const P = hashToPoint('seed-inverse-test');
    const Q = scalarMul(alphaInv, scalarMul(alpha, P));
    expect(pointEqual(P, Q)).toBe(true);
  });
});
