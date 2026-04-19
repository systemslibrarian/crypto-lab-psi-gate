/**
 * DH-PSI protocol implementation (Meadows 1986, Huberman-Franklin-Hogg 1999).
 *
 * SECURITY NOTE: This is semi-honest secure only. Actively malicious parties
 * can deviate from the protocol. Do not use in production without additional
 * malicious-security measures (e.g., zero-knowledge proofs of correct blinding).
 *
 * WHAT IS REVEALED:
 *   - Alice learns: the intersection (elements appearing in both sets)
 *   - Bob learns:   |A| (the size of Alice's set)
 *   - Alice learns: |B| (the size of Bob's set)
 *   - Neither party learns anything else about the other's non-intersection elements.
 */
import {
  type GroupPoint,
  type Scalar,
  randomScalar,
  hashToPoint,
  scalarMul,
ToHex,
} from './group.js';

// ---------------------------------------------------------------------------
// Protocol message types
// ---------------------------------------------------------------------------

export interface AliceRound1 {
  /** X_i = α · H(a_i), shuffled before sending */
  blindedElements: GroupPoint[];
  /** α — Alice keeps this privately; never sent to Bob */
  aliceScalar: Scalar;
  /** Maps the hex of shuffled X_i back to Alice's original element string */
  aliceOriginalMapping: Map<string, string>;
}

export interface BobRound2 {
  /** Y_i = β · X_i = αβ · H(a_i) */
  doubleBlindedAliceElements: GroupPoint[];
  /** Z_j = β · H(b_j) */
  bobBlindedElements: GroupPoint[];
  /** β — Bob keeps this privately; never sent to Alice */
  bobScalar: Scalar;
}

export interface PSIResult {
  intersection: string[];
  intersectionSize: number;
  aliceLearnedBobSize: number;
  bobLearnedAliceSize: number;
}

// ---------------------------------------------------------------------------
// Fisher-Yates shuffle (crypto.getRandomValues only — no Math.random)
// ---------------------------------------------------------------------------

function cryptoShuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const buf = new Uint8Array(4);
    crypto.getRandomValues(buf);
    const view = new DataView(buf.buffer);
    const j = view.getUint32(0, false) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Protocol rounds
// ---------------------------------------------------------------------------

/**
 * ALICE ROUND 1:
 *   Pick fresh random scalar α.
 *   Blind each element: X_i = α · H(a_i).
 *   Shuffle the blinded list before sending.
 */
export function aliceRound1(aliceSet: string[]): AliceRound1 {
  const aliceScalar = randomScalar();

  // Blind each element
  const pairs: Array<{ point: GroupPoint; element: string }> = aliceSet.map(
    (el) => ({ point: scalarMul(aliceScalar, hashToPoint(el)), element: el })
  );

  // Shuffle
  const shuffled = cryptoShuffle(pairs);

  // Build mapping: hex(X_i) → original element
  const aliceOriginalMapping = new Map<string, string>();
  for (const { point, element } of shuffled) {
    aliceOriginalMapping.set(pointToHex(point), element);
  }

  return {
    blindedElements: shuffled.map((p) => p.point),
    aliceScalar,
    aliceOriginalMapping,
  };
}

/**
 * BOB ROUND 2:
 *   Pick fresh random scalar β.
 *   Double-blind Alice's elements: Y_i = β · X_i.
 *   Blind his own elements:        Z_j = β · H(b_j).
 *   Shuffle both lists before sending.
 */
export function bobRound2(
  aliceRound1Output: { blindedElements: GroupPoint[] },
  bobSet: string[]
): BobRound2 {
  const bobScalar = randomScalar();

  // Y_i = β · X_i  (preserve order so Alice can recover element identity)
  const doubleBlindedAliceElements = aliceRound1Output.blindedElements.map(
    (X) => scalarMul(bobScalar, X)
  );

  // Z_j = β · H(b_j)  (shuffle so Bob's element ordering is hidden)
  const bobBlindedElements = cryptoShuffle(
    bobSet.map((el) => scalarMul(bobScalar, hashToPoint(el)))
  );

  return { doubleBlindedAliceElements, bobBlindedElements, bobScalar };
}

/**
 * ALICE ROUND 3 (final):
 *   Double-blind Bob's elements: W_j = α · Z_j = αβ · H(b_j).
 *   For each Y_i = αβ·H(a_i), check if it equals any W_j.
 *   If Y_i == W_j, then a_i is in the intersection.
 */
export function aliceRound3(
  aliceRound1Output: AliceRound1,
  bobRound2Output: BobRound2,
  _aliceSet: string[]
): PSIResult {
  const { aliceScalar, aliceOriginalMapping, blindedElements } = aliceRound1Output;
  const { doubleBlindedAliceElements, bobBlindedElements } = bobRound2Output;

  // W_j = α · Z_j = αβ · H(b_j)
  const W: GroupPoint[] = bobBlindedElements.map((Z) =>
    scalarMul(aliceScalar, Z)
  );

  // Build set of W_j hex values for O(1) lookup
  const wSet = new Set<string>();
  for (const w of W) {
    wSet.add(pointToHex(w));
  }

  // Y_i = β · X_i = αβ · H(a_i) (preserved order from Bob Round 2).
  // For each Y_i, check membership in wSet.
  // Match ⟺ αβ·H(a_i) = αβ·H(b_j) for some j ⟺ a_i = b_j.
  // Recover a_i using aliceOriginalMapping (hex(X_i) → a_i).
  const intersection: string[] = [];
  for (let i = 0; i < doubleBlindedAliceElements.length; i++) {
    const Y = doubleBlindedAliceElements[i];
    if (wSet.has(pointToHex(Y))) {
      const Xi = blindedElements[i];
      const originalElement = aliceOriginalMapping.get(pointToHex(Xi));
      if (originalElement !== undefined) {
        intersection.push(originalElement);
      }
    }
  }

  return {
    intersection,
    intersectionSize: intersection.length,
    aliceLearnedBobSize: bobBlindedElements.length,
    bobLearnedAliceSize: blindedElements.length,
  };
}

/**
 * Run the complete DH-PSI protocol end-to-end.
 * In a real deployment, rounds 1 and 2 would go over the network.
 */
export function runPSI(aliceSet: string[], bobSet: string[]): PSIResult {
  const r1 = aliceRound1(aliceSet);
  const r2 = bobRound2(r1, bobSet);
  return aliceRound3(r1, r2, aliceSet);
}

/**
 * Verify correctness: compare PSI output to plaintext intersection.
 * Used for the demo's "honest verifier" panel — NOT a security feature.
 */
export function verifyCorrectness(
  aliceSet: string[],
  bobSet: string[],
  psiResult: PSIResult
): { matches: boolean; expected: string[]; actual: string[] } {
  const bobSetS = new Set(bobSet);
  const expected = aliceSet.filter((el) => bobSetS.has(el)).sort();
  const actual = [...psiResult.intersection].sort();
  const matches =
    expected.length === actual.length &&
    expected.every((el, i) => el === actual[i]);
  return { matches, expected, actual };
}
