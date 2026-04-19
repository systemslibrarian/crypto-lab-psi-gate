/**
 * DH-PSI protocol (Meadows 1986, Huberman-Franklin-Hogg 1999).
 *
 * Semi-honest secure only. Actively malicious parties can deviate.
 *
 * What is revealed:
 *   Alice learns: the intersection + |B| (Bob's set size)
 *   Bob learns:   |A| (Alice's set size)
 *   Neither learns anything about the other's non-intersection elements.
 */
import {
  type GroupPoint,
  type Scalar,
  randomScalar,
  hashToPoint,
  scalarMul,
  pointToHex,
} from './group.js';

export interface AliceRound1 {
  /** X_i = α · H(a_i), shuffled */
  blindedElements: GroupPoint[];
  /** α — kept private by Alice, never sent */
  aliceScalar: Scalar;
  /** hex(X_i) → original element string */
  aliceOriginalMapping: Map<string, string>;
}

export interface BobRound2 {
  /** Y_i = β · X_i = αβ · H(a_i) */
  doubleBlindedAliceElements: GroupPoint[];
  /** Z_j = β · H(b_j), shuffled */
  bobBlindedElements: GroupPoint[];
  /** β — kept private by Bob, never sent */
  bobScalar: Scalar;
}

export interface PSIResult {
  intersection: string[];
  intersectionSize: number;
  aliceLearnedBobSize: number;
  bobLearnedAliceSize: number;
}

/** Fisher-Yates shuffle using crypto.getRandomValues only. */
function cryptoShuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const buf = new Uint8Array(4);
    crypto.getRandomValues(buf);
    const j = new DataView(buf.buffer).getUint32(0, false) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * ALICE ROUND 1: blind each element X_i = α · H(a_i), shuffle before sending.
 */
export function aliceRound1(aliceSet: string[]): AliceRound1 {
  const aliceScalar = randomScalar();
  const pairs = aliceSet.map((el) => ({
    point: scalarMul(aliceScalar, hashToPoint(el)),
    element: el,
  }));
  const shuffled = cryptoShuffle(pairs);
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
 *   Y_i = β · X_i (order preserved so Alice can recover element identity)
 *   Z_j = β · H(b_j) (shuffled)
 */
export function bobRound2(
  aliceRound1Output: { blindedElements: GroupPoint[] },
  bobSet: string[]
): BobRound2 {
  const bobScalar = randomScalar();
  const doubleBlindedAliceElements = aliceRound1Output.blindedElements.map(
    (X) => scalarMul(bobScalar, X)
  );
  const bobBlindedElements = cryptoShuffle(
    bobSet.map((el) => scalarMul(bobScalar, hashToPoint(el)))
  );
  return { doubleBlindedAliceElements, bobBlindedElements, bobScalar };
}

/**
 * ALICE ROUND 3: W_j = α · Z_j. Match Y_i ∈ {W_j} → a_i is in intersection.
 */
export function aliceRound3(
  aliceRound1Output: AliceRound1,
  bobRound2Output: BobRound2,
  _aliceSet: string[]
): PSIResult {
  const { aliceScalar, aliceOriginalMapping, blindedElements } = aliceRound1Output;
  const { doubleBlindedAliceElements, bobBlindedElements } = bobRound2Output;

  const wSet = new Set<string>(
    bobBlindedElements.map((Z) => pointToHex(scalarMul(aliceScalar, Z)))
  );

  const intersection: string[] = [];
  for (let i = 0; i < doubleBlindedAliceElements.length; i++) {
    if (wSet.has(pointToHex(doubleBlindedAliceElements[i]))) {
      const orig = aliceOriginalMapping.get(pointToHex(blindedElements[i]));
      if (orig !== undefined) intersection.push(orig);
    }
  }

  return {
    intersection,
    intersectionSize: intersection.length,
    aliceLearnedBobSize: bobBlindedElements.length,
    bobLearnedAliceSize: blindedElements.length,
  };
}

/** Run the complete protocol end-to-end. */
export function runPSI(aliceSet: string[], bobSet: string[]): PSIResult {
  const r1 = aliceRound1(aliceSet);
  const r2 = bobRound2(r1, bobSet);
  return aliceRound3(r1, r2, aliceSet);
}

/** Verify correctness against plain-text intersection (demo only). */
export function verifyCorrectness(
  aliceSet: string[],
  bobSet: string[],
  psiResult: PSIResult
): { matches: boolean; expected: string[]; actual: string[] } {
  const bobSetS = new Set(bobSet);
  const expected = aliceSet.filter((el) => bobSetS.has(el)).sort();
  const actual = [...psiResult.intersection].sort();
  const matches =
    expected.length === actual.length && expected.every((el, i) => el === actual[i]);
  return { matches, expected, actual };
}
