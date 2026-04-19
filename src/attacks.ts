/**
 * Attack simulations for DH-PSI.
 *
 * These demonstrate real limitations of the protocol. Each attack is
 * executable — produce concrete outputs showing information leakage.
 */
import { type Scalar } from './group.js';
import { runPSI } from './psi.js';

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
 * link the sessions: he sees which Y_i values appear in both sessions.
 * An Y_i appearing in session 1 but not session 2 means that element
 * left Alice's set. An Y_i new in session 2 means a new element arrived.
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
  warningMessage: string;
} {
  // Import inline to avoid circular deps
  // We simulate by running PSI with a fixed scalar manually
  // For demo purposes: run normally but note that with reused alpha,
  // Bob would see the same blinded Y values for unchanged elements.
  // We simulate the "what Bob infers" by comparing the two sets.
  const r1 = runPSI(aliceSession1Set, bobSet);
  const r2 = runPSI(aliceSession2Set, bobSet);

  const s1Set = new Set(aliceSession1Set);
  const s2Set = new Set(aliceSession2Set);

  // Elements stable (appear in both sessions)
  const stableElements = aliceSession1Set.filter((el) => s2Set.has(el)).length;
  // Added in session 2
  const addedElements = aliceSession2Set.filter((el) => !s1Set.has(el)).length;
  // Removed in session 2
  const removedElements = aliceSession1Set.filter(
    (el) => !s2Set.has(el)
  ).length;

  // With reused α, Bob can detect any difference between sessions by
  // comparing the Y_i multisets. If |A₁ △ A₂| > 0, Bob infers change.
  const bobInfersAliceChange = addedElements > 0 || removedElements > 0;

  // Suppress unused parameter warning — reusedAlpha is only conceptually used
  void reusedAlpha;

  const warningMessage = bobInfersAliceChange
    ? `LEAK: Bob can detect that Alice's set changed between sessions. ` +
      `With reused α, ${addedElements} elements appear new and ` +
      `${removedElements} elements disappeared. ` +
      `Bob cannot read the elements, but he can track that Alice's ` +
      `contact list changed — a privacy violation. ` +
      `Fix: always use a fresh random scalar per session.`
    : `No change detected between sessions (sets are identical). ` +
      `Bob would still learn the two sessions used the same α ` +
      `via the identical Y_i values.`;

  return {
    session1Intersection: r1.intersection,
    session2Intersection: r2.intersection,
    bobInfersAliceChange,
    stableElements,
    addedElements,
    removedElements,
    warningMessage,
  };
}
