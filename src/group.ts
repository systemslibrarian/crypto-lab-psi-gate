/**
 * Group primitives for DH-PSI using ristretto255.
 *
 * Ristretto255 is a prime-order group built on Curve25519.
 * It provides the DDH hardness assumption needed for DH-PSI security.
 */

// Use @ts-nocheck to bypass the protected `.ep` field access in @noble/curves v2.
// All operations are legitimate cryptographic scalar multiplications.
// The library doesn't expose a public scalar-mult API on the ristretto wrapper,
// so we access the underlying Edwards point via the protected field.
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

// Obtain the Edwards point class from the module's Point static.
// ristretto255_hasher.Point is the ristretto wrapper; its BASE.ep is the underlying
// Edwards generator. We capture the constructor via any-cast.
const _wrapperBase: any = ristretto255_hvia type-safe path.
// ristretto255_hasher.Point resolves over the hasher's internal point class;
// we cast to access the ristretto PrimeEdwardsPoint internals.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _hasherAny = ristretto255_hasher as any;
type EdwardsPoint = { multiply(n: bigint): EdwardsPoint; equals(other: EdwardsPoint): boolean; toBytes(): Uint8Array; toHex(): string };
const EdPtClass = _hasherAny.Point as { fromHex: (hex: string) => EdwardsPoint // ---------------------------------------------------------------------------

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
  const edPt: any = wrapper.ep;
  return edPt.toBytes() as Uint8Array;
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
  const result: any = edPt.multiply(s);
  return result.toBytes() as Uint8Array;
}

/**
 * Compare two group points for equality.
 */
export function pointEqual(a: GroupPoint, b: GroupPoint): boolean {
  if (a.length !== b.length) return false;
  const hexA = Array.from(a).map((x) => x.toString(16).padStart(2, '0')).join('');
  const hexB = Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
  const ptA: any = EdPtClass.fromHex(hexA);
  const ptB: any = EdPtClass.fromHex(hexB);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapper = ristretto255_hasher.hashToCurve(bytes) as any;
  return pointToBytes(wrapper.ep as EdwardsPoint

/** Encode a point as a lowercase hex string for "network transmission". */
export function pointToHex(p: GroupPoint): string {
  return Array.from(p)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

/** Decode a hex string back to a point. */
export function hexToPoint(h: string): GroupPoint {
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
