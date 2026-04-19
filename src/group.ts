/**
 * Group primitives for DH-PSI using ristretto255.
 *
 * Ristretto255 is a prime-order group built on Curve25519.
 * It provides the DDH hardness assumption needed for DH-PSI security.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ristretto255_hasher } from '@noble/curves/ed25519.js';

export type GroupPoint = Uint8Array;
export type Scalar = Uint8Array;

export const GROUP = {
  pointBytes: 32,
  scalarBytes: 32,
  orderBytes: 32,
} as const;

const ORDER: bigint = ristretto255_hasher.Point.Fn.ORDER;

// Obtain the Edwards point class by reaching through the ristretto wrapper.
// @noble/curves v2 marks .ep as protected, so we use any-cast to access it.
const _wrapperBase: any = ristretto255_hasher.Point.BASE;
const EdPtClass: any = Object.getPrototypeOf(_wrapperBase.ep).constructor;

function bigintToBytes(n: bigint): Uint8Array {
  const hex = n.toString(16).padStart(64, '0');
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToBigint(b: Uint8Array): bigint {
  let hex = '';
  for (const byte of b) hex += byte.toString(16).padStart(2, '0');
  return BigInt('0x' + hex);
}

/**
 * Generate a random scalar in [1, order-1].
 * Uses crypto.getRandomValues — no Math.random.
 */
export function randomScalar(): Scalar {
  let n: bigint;
  do {
    const buf = new Uint8Array(32);
    crypto.getRandomValues(buf);
    n = bytesToBigint(buf);
  } while (n === 0n || n >= ORDER);
  return bigintToBytes(n);
}

/**
 * Hash an arbitrary string to a ristretto255 group point.
 * Uses ristretto255_hasher.hashToCurve (RFC 9380 compliant).
 */
export function hashToPoint(element: string): GroupPoint {
  const bytes = new TextEncoder().encode(element);
  const wrapper: any = ristretto255_hasher.hashToCurve(bytes);
  return (wrapper.ep as any).toBytes() as Uint8Array;
}

/**
 * Scalar multiplication: scalar · point in ristretto255.
 */
export function scalarMul(scalar: Scalar, point: GroupPoint): GroupPoint {
  const s = bytesToBigint(scalar);
  const hex = Array.from(point)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
  const edPt: any = EdPtClass.fromHex(hex);
  return (edPt.multiply(s) as any).toBytes() as Uint8Array;
}

/**
 * Compare two group points for equality.
 */
export function pointEqual(a: GroupPoint, b: GroupPoint): boolean {
  if (a.length !== b.length) return false;
  const toHex = (p: GroupPoint) =>
    Array.from(p)
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('');
  const ptA: any = EdPtClass.fromHex(toHex(a));
  const ptB: any = EdPtClass.fromHex(toHex(b));
  return ptA.equals(ptB) as boolean;
}

/** Encode a point as a lowercase hex string. */
export function pointToHex(p: GroupPoint): string {
  return Array.from(p)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

/** Decode a hex string back to a GroupPoint. */
export function hexToPoint(h: string): GroupPoint {
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
