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

// The ristretto255 prime-order wrapper. All point encoding/decoding here
// goes through the canonical RFC 9496 ristretto encoding so the byte
// strings interoperate with any standards-compliant ristretto255 library
// (libsodium, ristretto-rs, …).
const RistrettoPt: any = ristretto255_hasher.Point;

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
 * Derive a scalar deterministically from a hex seed string.
 * Used for reproducible test vectors only — NEVER for production.
 * Reduces the seed mod ORDER and clamps to [1, ORDER-1].
 */
export function scalarFromSeed(hexSeed: string): Scalar {
  let h = hexSeed.toLowerCase().replace(/[^0-9a-f]/g, '');
  if (h.length === 0) h = '01';
  // Pad/truncate to 64 hex chars (32 bytes).
  if (h.length < 64) h = h.padStart(64, '0');
  if (h.length > 64) h = h.slice(-64);
  let n = BigInt('0x' + h) % ORDER;
  if (n === 0n) n = 1n;
  return bigintToBytes(n);
}

/**
 * Check whether the given 32 bytes decode to a valid ristretto255 point.
 * Returns false for non-canonical encodings, low-order points,
 * or otherwise-invalid inputs. Crucial for malicious-secure PSI.
 */
export function isValidPoint(bytes: Uint8Array): boolean {
  if (bytes.length !== 32) return false;
  try {
    // ristretto255 decoding rejects non-canonical / invalid encodings
    // and (by design) excludes the cofactor / low-order subgroup.
    RistrettoPt.fromBytes(bytes);
    // The identity element decodes successfully but is dangerous in PSI:
    // β·O = O for every i, collapsing all outputs. Reject it explicitly.
    return !bytes.every((b) => b === 0);
  } catch {
    return false;
  }
}

/**
 * Domain separation tag for hashToCurve. Tag any output of this PSI build
 * so it cannot be confused with hash-to-curve outputs from another protocol
 * sharing the same ristretto255 group (e.g., OPAQUE, VOPRF). Versioned so a
 * future protocol bump doesn't collide with this published test vector set.
 */
export const HASH_TO_CURVE_DST = 'PSI-GATE-v1-RISTRETTO255_XMD:SHA-512_R_';

/**
 * Hash an arbitrary string to a ristretto255 group point.
 * Uses ristretto255_hasher.hashToCurve (RFC 9380 compliant) with a
 * domain-separation tag and returns the canonical 32-byte ristretto
 * encoding (RFC 9496).
 */
export function hashToPoint(element: string): GroupPoint {
  const bytes = new TextEncoder().encode(element);
  const wrapper: any = ristretto255_hasher.hashToCurve(bytes, { DST: HASH_TO_CURVE_DST });
  return wrapper.toBytes() as Uint8Array;
}

/**
 * Compute the multiplicative inverse of a scalar mod the group order.
 * Required for OPRF-PSI: Alice unblinds by multiplying by α⁻¹.
 * Uses Fermat's little theorem: a⁻¹ ≡ a^(ORDER-2) (mod ORDER).
 * Throws on 0 (no inverse).
 */
export function scalarInverse(scalar: Scalar): Scalar {
  const n = bytesToBigint(scalar);
  if (n === 0n) throw new Error('scalarInverse: zero has no inverse');
  // Use the field arithmetic from noble (constant-time path inside the lib).
  const inv = ristretto255_hasher.Point.Fn.inv(n);
  return bigintToBytes(inv);
}

/**
 * Scalar multiplication: scalar · point in ristretto255.
 * Operates on canonical 32-byte ristretto encodings.
 */
export function scalarMul(scalar: Scalar, point: GroupPoint): GroupPoint {
  const s = bytesToBigint(scalar);
  const pt: any = RistrettoPt.fromBytes(point);
  return pt.multiply(s).toBytes() as Uint8Array;
}

/**
 * Compare two group points for equality on their canonical encoding.
 * Since ristretto255 has a unique canonical encoding per group element,
 * byte equality is point equality.
 */
export function pointEqual(a: GroupPoint, b: GroupPoint): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
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
