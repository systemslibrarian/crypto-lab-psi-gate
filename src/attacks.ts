/**
 * Attack simulations for DH-PSI.
 *
 * These demonstrate real limitations of the protocol. Each attack is
 * executable — produce concrete outputs showing information leakage.
 */
import {
  type GroupPoint,
  type Scalar,
  pointToHex,
  isValidPoint,
  randomScalar,
  InvalidPointError,
} from './group.js';
import { bobRound2, runPSI, tracePSI } from './psi.js';
import {
  oprfBobSetup,
  oprfAliceRound1,
  oprfBobRound2,
  oprfAliceRound3,
} from './oprf-psi.js';

// ---------------------------------------------------------------------------
// Attack 1 — Set Size Inflation
// ---------------------------------------------------------------------------

/**
 * MALICIOUS BOB: Bob inflates his set size.
 *
 * Bob can claim B has any number of elements at zero extra cost
 * (just add fake elements). Alice sees the inflated size.
 *
 * In the other direction: Bob can also DEFLATE (claim |B| = 1 when it's 10M)
 * to hide his database size. The PSI result is still correct for the real set,
 * but Alice's aliceLearnedBobSize is a lie.
 *
 * This demonstrates the "set size is revealed" limitation: it's revealed
 * only if Bob is honest. A malicious Bob can lie about it in both directions.
 */
export function simulateSetSizeInflation(
  aliceSet: string[],
  bobRealSet: string[],
  bobInflatedSet: string[]
): {
  aliceSeesBobSize: number;
  actualBobSize: number;
  intersection: string[];
  inflationDelta: number;
} {
  // Run PSI with the inflated set
  const result = runPSI(aliceSet, bobInflatedSet);
  return {
    aliceSeesBobSize: result.aliceLearnedBobSize,
    actualBobSize: bobRealSet.length,
    intersection: result.intersection,
    inflationDelta: bobInflatedSet.length - bobRealSet.length,
  };
}

// ---------------------------------------------------------------------------
// Attack 2 — Dictionary Attack
// ---------------------------------------------------------------------------

/**
 * DICTIONARY ATTACK: Bob enumerates a small domain.
 *
 * If Alice's set elements come from a small domain (e.g., 4-digit PINs,
 * short words, phone area codes), Bob can use the entire domain as his set B.
 * The PSI intersection reveals Alice's entire set.
 *
 * This is why PSI alone is insufficient for contact discovery in small domains.
 * Real deployments add: rate limiting, proof-of-work, or OPRF to prevent
 * offline enumeration.
 */
export function simulateDictionaryAttack(
  aliceSet: string[],
  bobDictionary: string[]
): {
  aliceElementsLearned: string[];
  coveragePercent: number;
  warningMessage: string;
} {
  const result = runPSI(aliceSet, bobDictionary);
  const aliceElementsLearned = result.intersection;
  const coveragePercent =
    aliceSet.length > 0
      ? Math.round((aliceElementsLearned.length / aliceSet.length) * 100)
      : 0;

  const warningMessage =
    `Dictionary of ${bobDictionary.length} entries revealed ` +
    `${aliceElementsLearned.length}/${aliceSet.length} ` +
    `of Alice's elements (${coveragePercent}% of her set). ` +
    `This attack works because the element domain is small enough to enumerate. ` +
    `Mitigation: rate limiting, proof-of-work, or OPRF-based PSI.`;

  return { aliceElementsLearned, coveragePercent, warningMessage };
}

// ---------------------------------------------------------------------------
// Attack 3 — Scalar Reuse (Session Linkage)
// ---------------------------------------------------------------------------

/**
 * REPLAY / SCALAR REUSE ATTACK:
 *
 * If Alice reuses the same scalar α across two PSI sessions, Bob can
 * link the sessions: he sees which X_i = α·H(a_i) values appear in both.
 * An X_i present in session 1 but not session 2 means that element left
 * Alice's set. An X_i new in session 2 means a new element arrived.
 *
 * The linked value is X_i, the round-1 A→B wire value — NOT Y_i = β·X_i.
 * Bob picks a fresh β each session, so Y_i differs across sessions even when
 * α is reused; it is Alice's half of the blinding that goes stale.
 *
 * Even without knowing what the elements are, Bob learns which elements
 * are stable vs changing — a privacy violation.
 *
 * Correct mitigation: fresh random α per session. MANDATORY.
 */
export function simulateReplayAttack(
  aliceSession1Set: string[],
  aliceSession2Set: string[],
  bobSet: string[],
  reusedAlpha: Scalar
): {
  session1Intersection: string[];
  session2Intersection: string[];
  bobInfersAliceChange: boolean;
  stableElements: number;
  addedElements: number;
  removedElements: number;
  /** Number of X_i hex strings Bob sees in BOTH sessions (purely from wire data). */
  linkedXCount: number;
  /** Truncated samples of linked X_i values — Bob sees these byte-for-byte twice. */
  linkedXSamples: string[];
  warningMessage: string;
} {
  // Both sessions are run with the REUSED α — that is the scenario being
  // demonstrated, so the intersections displayed have to come from it. (An
  // earlier version called runPSI here, which draws a fresh α internally; the
  // numbers came out the same but belonged to a different execution than the
  // one the panel describes.) tracePSI takes Alice's scalar explicitly; Bob
  // still draws a fresh β per session, exactly as an honest Bob would.
  const t1 = tracePSI(aliceSession1Set, bobSet, reusedAlpha, randomScalar());
  const t2 = tracePSI(aliceSession2Set, bobSet, reusedAlpha, randomScalar());

  // The leak, read straight off those two traces: Bob compares the X_i he
  // received in session 1 with the X_i he received in session 2. Stable
  // elements re-appear byte-for-byte, because α·H(a_i) is a deterministic
  // function of an unchanged α and an unchanged a_i. No plaintext involved.
  const xSession1 = t1.wireA2B_X.map(pointToHex);
  const xSession2 = t2.wireA2B_X.map(pointToHex);
  const xSession1Set = new Set(xSession1);
  const linkedX = xSession2.filter((x) => xSession1Set.has(x));
  const linkedXCount = linkedX.length;
  const linkedXSamples = linkedX.slice(0, 3).map((x) => x.slice(0, 16) + '…');

  const s1Set = new Set(aliceSession1Set);
  const s2Set = new Set(aliceSession2Set);
  const stableElements = aliceSession1Set.filter((el) => s2Set.has(el)).length;
  const addedElements = aliceSession2Set.filter((el) => !s1Set.has(el)).length;
  const removedElements = aliceSession1Set.filter((el) => !s2Set.has(el)).length;

  // Sanity check: the X_i overlap Bob observes equals the true stable count.
  // (If this ever diverges, the leak is even worse than advertised.)
  const bobInfersAliceChange =
    addedElements > 0 || removedElements > 0 || linkedXCount !== aliceSession1Set.length;

  const warningMessage = bobInfersAliceChange
    ? `LEAK: With reused α, Bob sees ${linkedXCount} byte-identical X_i value(s) ` +
      `across the two sessions — these are stable elements in Alice's set. ` +
      `Bob also sees ${addedElements} new X_i value(s) (added) and ` +
      `${removedElements} disappeared X_i value(s) (removed). ` +
      `He learns the size of the change without learning a single plaintext. ` +
      `Fix: fresh random α per session — MANDATORY.`
    : `Sets identical across sessions. Bob still sees ${linkedXCount} byte-identical ` +
      `X_i value(s), confirming the same α was used twice (a fingerprint by itself).`;

  return {
    session1Intersection: t1.intersection,
    session2Intersection: t2.intersection,
    bobInfersAliceChange,
    stableElements,
    addedElements,
    removedElements,
    linkedXCount,
    linkedXSamples,
    warningMessage,
  };
}

// ---------------------------------------------------------------------------
// Attack 4 — Malformed / Low-Order Point Injection
// ---------------------------------------------------------------------------

export interface InjectionProbe {
  /** Short label for the malicious encoding being probed. */
  label: string;
  /** The 32-byte encoding Bob tries to inject. */
  bytesHex: string;
  /** Whether ristretto255 decode + identity check accepted the point. */
  accepted: boolean;
  /** What would happen if accepted: human-readable consequence. */
  consequence: string;
  /**
   * Outcome of feeding this encoding into the REAL protocol path — psi.ts's
   * `bobRound2`, the function that receives X_i from Alice. `validated` means
   * assertValidPoints rejected it before any scalar touched it; `crashed`
   * means validation would have been skipped and the ristretto decode inside
   * scalarMul happened to blow up (a bug, not a defence — it depends on the
   * library, leaks a distinguishable error, and does not catch the identity);
   * `accepted` means it went through.
   */
  protocolOutcome: 'validated' | 'crashed' | 'accepted';
  /**
   * True when this encoding is invalid BY CONSTRUCTION and must always be
   * rejected. The random-bytes probe is not: roughly 1 in 16 random 32-byte
   * strings really is a valid ristretto encoding, and accepting one of those
   * is correct behaviour, not a validation failure. Only the deterministic
   * probes are evidence for or against the verdict.
   */
  mustBeRejected: boolean;
}

/**
 * Feed a candidate encoding into the actual receive path and report what
 * happened. This is the difference between a certificate and a claim: the
 * probe does not consult `isValidPoint` and then talk about the protocol, it
 * hands the bytes to the same `bobRound2` a real session calls.
 */
function probeProtocolPath(bytes: GroupPoint): 'validated' | 'crashed' | 'accepted' {
  try {
    bobRound2({ blindedElements: [bytes] }, ['probe@example.com']);
    return 'accepted';
  } catch (err) {
    return err instanceof InvalidPointError ? 'validated' : 'crashed';
  }
}

/**
 * MALICIOUS BOB / NETWORK ATTACKER: Submit malformed or special-form points.
 *
 * Some PSI variants on raw curves (Curve25519, secp256k1) are vulnerable to:
 *   - The identity element O — scalar·O = O, so all Y_i collapse to one value.
 *   - Low-order points — torsion subgroup leaks bits of α.
 *   - Non-canonical encodings — two distinct encodings of the same point,
 *     used to fingerprint implementations or fork signatures.
 *
 * Ristretto255 removes most of that class by construction:
 *   - The encoding is canonical (each point has exactly one byte form).
 *   - The group has prime order, so no low-order subgroup exists.
 *
 * What it does NOT remove is the identity: O has a perfectly valid ristretto
 * encoding (32 zero bytes) that decodes without complaint, and β·O = O. That
 * one needs an explicit check, and a check only counts if the protocol calls
 * it. So each probe here is run twice — once through `isValidPoint` in
 * isolation, and once through `bobRound2`, the real receive path — and the
 * verdict below is built from the protocol-path column, not the isolated one.
 */
export function simulateMalformedPointInjection(): {
  probes: InjectionProbe[];
  ristrettoVerdict: string;
} {
  const probes: InjectionProbe[] = [];

  // (1) Identity element — canonical ristretto encoding of O is 32 zero bytes.
  // Decoding succeeds on most libraries; an explicit identity check is needed.
  const identity = new Uint8Array(32);
  probes.push({
    label: 'Identity element O (all-zero encoding)',
    bytesHex: pointToHex(identity),
    accepted: isValidPoint(identity),
    protocolOutcome: probeProtocolPath(identity),
    mustBeRejected: true,
    consequence:
      'If accepted: β·O = O for every i, so every Y_i is the same point. ' +
      'Alice cannot distinguish elements; intersection result becomes meaningless ' +
      '(or trivially "all match" against another identity).',
  });

  // (2) Non-canonical encoding — high bit set in last byte (invalid in ristretto).
  const nonCanonical = new Uint8Array(32);
  nonCanonical[31] = 0x80;
  probes.push({
    label: 'Non-canonical encoding (high bit set)',
    bytesHex: pointToHex(nonCanonical),
    accepted: isValidPoint(nonCanonical),
    protocolOutcome: probeProtocolPath(nonCanonical),
    mustBeRejected: true,
    consequence:
      'On raw Ed25519, a malformed sign bit can encode the same point two ways, ' +
      'enabling implementation fingerprinting and signature malleability. ' +
      'Ristretto rejects all non-canonical encodings.',
  });

  // (3) Random 32 bytes — almost never a valid ristretto encoding.
  const garbage = new Uint8Array(32);
  crypto.getRandomValues(garbage);
  probes.push({
    label: 'Random 32 bytes (garbage)',
    bytesHex: pointToHex(garbage),
    accepted: isValidPoint(garbage),
    protocolOutcome: probeProtocolPath(garbage),
    mustBeRejected: false,
    consequence:
      'Most random 32-byte strings are not valid ristretto encodings (~94% rejection rate: only ' +
      'the ~2^252 group elements out of 2^256 byte strings decode, i.e. about 1 in 16). ' +
      'A protocol that skips validation would crash on scalarMul, or worse, fall through ' +
      'to an unspecified scalar field operation.',
  });

  // (4) Known low-order Edwards point encoding — included for raw-Ed25519 comparison.
  // On ristretto this should also be rejected because it's not in the prime-order group.
  const lowOrder = new Uint8Array([
    0xec, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f,
  ]);
  probes.push({
    label: 'Order-2 point (raw Curve25519 torsion)',
    bytesHex: pointToHex(lowOrder),
    accepted: isValidPoint(lowOrder),
    protocolOutcome: probeProtocolPath(lowOrder),
    mustBeRejected: true,
    consequence:
      'On raw Curve25519, this point has order 2: 2·P = O. Reveals the parity of α. ' +
      'Ristretto255 has prime order (no torsion subgroup) — encoding is rejected outright.',
  });

  // The verdict is read off what the PROTOCOL did, not off a standalone call
  // to isValidPoint. Only the deterministic probes count: the random-bytes one
  // is a valid ristretto encoding about 1 time in 16, and accepting a valid
  // point is correct behaviour, not a hole.
  const mustFail = probes.filter((p) => p.mustBeRejected);
  const gotThrough = mustFail.filter((p) => p.protocolOutcome === 'accepted');
  const validated = mustFail.filter((p) => p.protocolOutcome === 'validated');
  const random = probes.find((p) => !p.mustBeRejected);
  const randomNote = random
    ? random.protocolOutcome === 'accepted'
      ? ` The random-bytes probe happened to decode to a genuine group element this run ` +
        `(≈1 in 16 do) and was accepted — correctly: a valid point is a valid point, and it ` +
        `is not counted against the verdict.`
      : ` The random-bytes probe was also rejected, as ~15 in 16 random strings are.`
    : '';

  const ristrettoVerdict =
    gotThrough.length === 0
      ? `All ${mustFail.length} invalid-by-construction encodings were rejected by psi.ts's ` +
        `bobRound2 — the same function a real session calls when X_i arrives from Alice — and ` +
        `all ${validated.length} were caught by the explicit isValidPoint check before any ` +
        `scalar touched them.${randomNote} Ristretto255 is what makes most of this class ` +
        `impossible: canonical encodings, prime order, no torsion. The identity is the exception ` +
        `it does NOT cover — O encodes and decodes perfectly well, and β·O = O collapses every ` +
        `Y_i — so that one is caught only because the receive path validates.`
      : `WARNING: ${gotThrough.length}/${mustFail.length} invalid encodings passed through ` +
        `bobRound2 and were multiplied by β: ${gotThrough.map((p) => p.label).join('; ')}. ` +
        `The receive path is missing input validation.`;

  return { probes, ristrettoVerdict };
}

// ---------------------------------------------------------------------------
// Attack 5 — Malicious OPRF Bob: lying about his published set
// ---------------------------------------------------------------------------

/**
 * MALICIOUS BOB in OPRF-PSI: tamper with the published PRF tag set F.
 *
 * In OPRF-PSI Bob publishes F = { H₂(k·H(b)) : b ∈ B } and then evaluates the
 * OPRF on Alice's query. The protocol gives no integrity guarantee on F itself:
 *
 *   - Adding tags: Bob can compute and publish H₂(k·H(x)) for any x he chooses,
 *     including elements not in his real set. Alice's query for x will "match"
 *     and she will believe Bob has x.
 *   - Omitting tags: Bob can simply drop tags for elements in his real set.
 *     Alice's query for those will not match — silent false negatives.
 *
 * Mitigations require pinning F out of band: a signed commitment (Merkle root
 * with proof of inclusion), a hash transparency log, or a TEE-attested
 * publication. None of those are part of the protocol itself.
 */
export function simulateMaliciousOprfBob(
  aliceSet: string[],
  bobRealSet: string[],
  phantomAdds: string[],
  silentDrops: string[]
): {
  honest: { intersection: string[]; publishedSize: number };
  inflated: { intersection: string[]; publishedSize: number; falsePositives: string[] };
  deflated: { intersection: string[]; publishedSize: number; falseNegatives: string[] };
  warningMessage: string;
} {
  // Reuse the same OPRF key across the three runs so the attack isolates the
  // tamper-with-F variable rather than confounding it with a key change.
  const honestBob = oprfBobSetup(bobRealSet);
  const k = honestBob.bobKey;

  const honestQuery = oprfAliceRound1(aliceSet);
  const honestEval = oprfBobRound2(honestQuery, k);
  const honestResult = oprfAliceRound3(aliceSet, honestQuery, honestEval, honestBob.publishedSet);

  // Inflated F: Bob adds tags for elements he doesn't actually have.
  const inflatedFull = oprfBobSetup([...bobRealSet, ...phantomAdds], k);
  const inflatedQuery = oprfAliceRound1(aliceSet);
  const inflatedEval = oprfBobRound2(inflatedQuery, k);
  const inflatedResult = oprfAliceRound3(
    aliceSet, inflatedQuery, inflatedEval, inflatedFull.publishedSet
  );
  const realBobSetS = new Set(bobRealSet);
  const falsePositives = inflatedResult.intersection.filter((el) => !realBobSetS.has(el));

  // Deflated F: Bob drops tags for elements he really does have.
  const deflatedRealSet = bobRealSet.filter((el) => !silentDrops.includes(el));
  const deflatedBob = oprfBobSetup(deflatedRealSet, k);
  const deflatedQuery = oprfAliceRound1(aliceSet);
  const deflatedEval = oprfBobRound2(deflatedQuery, k);
  const deflatedResult = oprfAliceRound3(
    aliceSet, deflatedQuery, deflatedEval, deflatedBob.publishedSet
  );
  const expectedIntersection = aliceSet.filter((el) => realBobSetS.has(el));
  const deflatedFound = new Set(deflatedResult.intersection);
  const falseNegatives = expectedIntersection.filter((el) => !deflatedFound.has(el));

  const warningMessage =
    `Honest Bob: |F| = ${honestBob.publishedSet.size}, Alice sees intersection of size ` +
    `${honestResult.intersection.length}.  ` +
    `Inflated Bob added ${phantomAdds.length} phantom tag(s) → Alice now sees ` +
    `${falsePositives.length} false positive(s): {${falsePositives.join(', ') || '∅'}}.  ` +
    `Deflated Bob dropped ${silentDrops.length} real tag(s) → Alice silently misses ` +
    `${falseNegatives.length} match(es): {${falseNegatives.join(', ') || '∅'}}.  ` +
    `OPRF-PSI provides NO integrity on F — Alice must pin it out-of-band ` +
    `(signed commitment / transparency log / TEE attestation).`;

  return {
    honest: {
      intersection: [...honestResult.intersection].sort(),
      publishedSize: honestBob.publishedSet.size,
    },
    inflated: {
      intersection: [...inflatedResult.intersection].sort(),
      publishedSize: inflatedFull.publishedSet.size,
      falsePositives,
    },
    deflated: {
      intersection: [...deflatedResult.intersection].sort(),
      publishedSize: deflatedBob.publishedSet.size,
      falseNegatives,
    },
    warningMessage,
  };
}
