/**
 * OPRF-PSI (Jarecki-Liu, SCN 2010).
 *
 * NOT what Signal deploys: Signal's contact discovery (CDS/CDSI) runs on Intel SGX
 * enclaves with an ORAM lookup, and Signal's own writeup lists private set
 * intersection among the approaches that did not work for them. OPRF-PSI is the
 * academic alternative to the same problem, which is why it is worth building here.
 *
 * Bob holds a long-lived OPRF key k. He publishes (or commits to) the set
 *   F = { H₂(k·H₁(b_j)) : b_j ∈ B }
 * where H₁ is hash-to-curve and H₂ is a hash from group to bytes.
 *
 * To query, Alice picks a fresh random α, sends X_i = α·H₁(a_i) for each
 * a_i ∈ A. Bob returns Y_i = k·X_i. Alice computes α⁻¹·Y_i = k·H₁(a_i),
 * applies H₂, and checks membership in F.
 *
 * Why this is a real improvement over plain DH-PSI:
 *   - Bob's set is published only as PRF outputs (one round per query, not
 *     per session), so the per-query cost is independent of |B|.
 *   - The protocol reduces to (one-more) gap-DH, the same assumption that
 *     underpins blind signatures and VOPRFs.
 *   - It composes cleanly with rate limiting and anonymous credentials.
 *
 * What stays the same as DH-PSI:
 *   - Still semi-honest secure only (this file).
 *   - Set sizes are still revealed (here: |A| in the query batch).
 *   - Dictionary attacks still apply if Alice's element domain is small.
 */
import { sha256 } from '@noble/hashes/sha2.js';
import {
  type GroupPoint,
  type Scalar,
  randomScalar,
  hashToPoint,
  scalarMul,
  scalarInverse,
} from './group.js';

export interface OPRFKeyMaterial {
  /** k — Bob's long-lived OPRF key. Single-source-of-truth secret. */
  bobKey: Scalar;
  /** F = { H₂(k·H₁(b_j)) } — published PRF outputs (set of hex strings). */
  publishedSet: Set<string>;
  /** |B|, exposed only because the demo wants to display it. */
  bobSetSize: number;
}

export interface OPRFAliceRound1 {
  /** α — Alice's per-query blinding scalar. Fresh per query. */
  aliceScalar: Scalar;
  /** X_i = α·H₁(a_i), in query order (no shuffle needed; Bob is stateless). */
  blindedElements: GroupPoint[];
}

export interface OPRFBobRound2 {
  /** Y_i = k·X_i, same order as Alice's query. */
  evaluatedElements: GroupPoint[];
}

export interface OPRFResult {
  intersection: string[];
  intersectionSize: number;
  /** Number of PRF entries Bob published — what Alice learns about |B|. */
  aliceLearnedBobSize: number;
  /** Per-query |A| — what Bob learns. */
  bobLearnedAliceSize: number;
}

/**
 * Domain separation prefix for the H₂ hash in this OPRF instance.
 * Mixed in front of the ristretto encoding before hashing so PRF tags
 * cannot be reused as hash outputs from another protocol on the same group.
 */
const OPRF_H2_DST = new TextEncoder().encode('PSI-GATE-v1-OPRF-H2');

/**
 * H₂: ristretto point → 32-byte hex tag.
 *
 * Domain-separated SHA-256 over (DST || pointBytes). The DST prevents tag
 * reuse across protocols on the same group; SHA-256 collapses the algebraic
 * structure (every output is a uniform 256-bit string, indistinguishable
 * from random under ROM) so the published `F` set leaks no group structure
 * beyond what a generic random function would.
 */
function prfTag(p: GroupPoint): string {
  const input = new Uint8Array(OPRF_H2_DST.length + p.length);
  input.set(OPRF_H2_DST, 0);
  input.set(p, OPRF_H2_DST.length);
  const digest = sha256(input);
  let hex = '';
  for (const b of digest) hex += b.toString(16).padStart(2, '0');
  return hex;
}

/**
 * Bob's offline setup: given his set and his long-lived key (or a fresh
 * one), compute the published PRF tag set. Done ONCE, reused across queries.
 */
export function oprfBobSetup(bobSet: string[], bobKey?: Scalar): OPRFKeyMaterial {
  const k = bobKey ?? randomScalar();
  const tags = new Set<string>();
  for (const el of bobSet) {
    tags.add(prfTag(scalarMul(k, hashToPoint(el))));
  }
  return { bobKey: k, publishedSet: tags, bobSetSize: bobSet.length };
}

/**
 * Alice's online round 1: blind her query set with a fresh per-query α.
 */
export function oprfAliceRound1(aliceSet: string[]): OPRFAliceRound1 {
  const aliceScalar = randomScalar();
  const blindedElements = aliceSet.map((el) =>
    scalarMul(aliceScalar, hashToPoint(el))
  );
  return { aliceScalar, blindedElements };
}

/**
 * Bob's online round 2: evaluate the OPRF on the blinded query.
 * Bob does NOT learn the plaintext elements — only blinded points.
 */
export function oprfBobRound2(
  query: OPRFAliceRound1,
  bobKey: Scalar
): OPRFBobRound2 {
  return {
    evaluatedElements: query.blindedElements.map((X) => scalarMul(bobKey, X)),
  };
}

/**
 * Alice's online round 3: unblind with α⁻¹, apply H₂, look up in F.
 */
export function oprfAliceRound3(
  aliceSet: string[],
  round1: OPRFAliceRound1,
  round2: OPRFBobRound2,
  bobPublished: Set<string>
): OPRFResult {
  const alphaInv = scalarInverse(round1.aliceScalar);
  const intersection: string[] = [];
  for (let i = 0; i < aliceSet.length; i++) {
    const unblinded = scalarMul(alphaInv, round2.evaluatedElements[i]!);
    if (bobPublished.has(prfTag(unblinded))) intersection.push(aliceSet[i]!);
  }
  return {
    intersection,
    intersectionSize: intersection.length,
    aliceLearnedBobSize: bobPublished.size,
    bobLearnedAliceSize: aliceSet.length,
  };
}

/** Run the complete OPRF-PSI protocol end-to-end (setup + query). */
export function runOPRFPSI(aliceSet: string[], bobSet: string[]): OPRFResult {
  const bob = oprfBobSetup(bobSet);
  const r1 = oprfAliceRound1(aliceSet);
  const r2 = oprfBobRound2(r1, bob.bobKey);
  return oprfAliceRound3(aliceSet, r1, r2, bob.publishedSet);
}
