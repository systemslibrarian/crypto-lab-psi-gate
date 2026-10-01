import { describe, it, expect } from 'vitest';
import {
  simulateSetSizeInflation,
  simulateDictionaryAttack,
  simulateReplayAttack,
  simulateMalformedPointInjection,
  simulateMaliciousOprfBob,
} from '../src/attacks.js';
import { randomScalar, hashToPoint, scalarMul, pointToHex, isValidPoint } from '../src/group.js';

describe('attack simulations', () => {
  it('set-size inflation reports the inflated count and a correct intersection', () => {
    const A = ['x', 'y', 'z'];
    const real = ['x', 'real'];
    const inflated = [...real, ...Array.from({ length: 10 }, (_, i) => 'fake-' + i)];
    const r = simulateSetSizeInflation(A, real, inflated);
    expect(r.aliceSeesBobSize).toBe(inflated.length);
    expect(r.actualBobSize).toBe(real.length);
    expect(r.intersection).toEqual(['x']);
    expect(r.inflationDelta).toBe(10);
  });

  it('dictionary attack reveals Alice elements covered by the dictionary', () => {
    const A = ['1234', '5678', 'not-in-dict'];
    const dict = Array.from({ length: 50 }, (_, i) => i.toString().padStart(4, '0'))
      .concat(['1234', '5678']);
    const r = simulateDictionaryAttack(A, dict);
    expect(r.aliceElementsLearned.sort()).toEqual(['1234', '5678']);
    expect(r.coveragePercent).toBe(Math.round((2 / 3) * 100));
  });

  it('replay attack: linkedXCount equals stable elements when α is reused', () => {
    const s1 = ['alice', 'bob', 'carol'];
    const s2 = ['alice', 'bob', 'dave']; // carol removed, dave added
    const B = ['alice', 'service'];
    const alpha = randomScalar();
    const r = simulateReplayAttack(s1, s2, B, alpha);
    // Two stable: alice, bob. Bob should see exactly two byte-identical X_i.
    expect(r.linkedXCount).toBe(2);
    expect(r.addedElements).toBe(1);
    expect(r.removedElements).toBe(1);
    expect(r.bobInfersAliceChange).toBe(true);

    // PROVENANCE: the linked samples must be prefixes of α·H(el) under the α
    // that was passed IN — not some other execution's scalar. This is the
    // assertion that fails if the simulation ever goes back to computing its
    // displayed values with a freshly drawn α.
    const expectedPrefixes = ['alice', 'bob']
      .map((el) => pointToHex(scalarMul(alpha, hashToPoint(el))).slice(0, 16) + '…')
      .sort();
    expect([...r.linkedXSamples].sort()).toEqual(expectedPrefixes);

    // The displayed intersections come from those same reused-α sessions.
    expect(r.session1Intersection).toEqual(['alice']);
    expect(r.session2Intersection).toEqual(['alice']);
  });

  it('replay attack: identical sessions still reveal that α was reused', () => {
    const s = ['a', 'b'];
    const r = simulateReplayAttack(s, s, ['b'], randomScalar());
    // No additions or removals, so under our combined check this is "no change".
    expect(r.addedElements).toBe(0);
    expect(r.removedElements).toBe(0);
    expect(r.linkedXCount).toBe(2);
  });

  it('malformed point injection: no encoding survives the real receive path', () => {
    // The certificate this demo prints is about the PROTOCOL, so the test is
    // about the protocol: nothing may reach a scalar multiplication.
    const { probes, ristrettoVerdict } = simulateMalformedPointInjection();
    // Only the invalid-by-construction probes are assertable: the random-bytes
    // one decodes to a real group element ~1 time in 16, and accepting a valid
    // point is correct.
    const mustFail = probes.filter((p) => p.mustBeRejected);
    expect(mustFail).toHaveLength(3);
    for (const p of mustFail) {
      expect(p.protocolOutcome).toBe('validated');
    }
    // The identity in particular decodes fine on the group level — it is caught
    // ONLY because bobRound2 validates. If validation is ever removed from the
    // receive path, this flips to 'accepted' and every Y_i collapses to O.
    const identity = probes.find((p) => p.label.includes('Identity'))!;
    expect(identity.protocolOutcome).toBe('validated');
    expect(ristrettoVerdict).toMatch(/rejected by psi\.ts's bobRound2/);
  });

  it('malformed point injection: identity / non-canonical / torsion always rejected', () => {
    const { probes } = simulateMalformedPointInjection();
    expect(probes).toHaveLength(4);
    // The three structured probes are deterministic — they must always fail
    // ristretto decoding. The "random 32 bytes" probe is probabilistic
    // (~4% of random strings happen to be valid ristretto encodings),
    // so we assert behaviour on the deterministic ones only.
    const byLabel = Object.fromEntries(probes.map((p) => [p.label, p]));
    expect(byLabel['Identity element O (all-zero encoding)']!.accepted).toBe(false);
    expect(byLabel['Non-canonical encoding (high bit set)']!.accepted).toBe(false);
    expect(byLabel['Order-2 point (raw Curve25519 torsion)']!.accepted).toBe(false);
  });

  it('malformed point injection: random 32-byte strings decode at the expected 1/16 rate', () => {
    // A random 32-byte string is a valid ristretto255 encoding with probability
    // about 1/16: the top bit must be clear, s must be non-negative, the square
    // root must exist, and t must be non-negative (each about 1/2). Measured over
    // 200,000 strings: 6.18%.
    //
    // This used to sample 50 strings and require under 15%. At a true rate of
    // 6.25% that fails about one run in a hundred (8 of 50 accepted), and it did
    // on main once the test became part of the deploy gate. 4,000 samples give a
    // standard deviation of about 0.38 points, so the band below sits more than
    // four deviations from 1/16 on each side: a false failure is negligible, and
    // a decoder that accepts everything, or nothing, still fails at once.
    const TRIALS = 4000;
    const bytes = new Uint8Array(32);
    let accepted = 0;
    for (let i = 0; i < TRIALS; i++) {
      crypto.getRandomValues(bytes);
      if (isValidPoint(bytes)) accepted++;
    }
    const rate = accepted / TRIALS;
    expect(rate).toBeGreaterThan(0.045);
    expect(rate).toBeLessThan(0.08);
    // The probe the lab shows is the same check on one random string.
    const rnd = simulateMalformedPointInjection().probes.find((p) => p.label.includes('Random'));
    expect(rnd).toBeDefined();
  });

  it('malicious OPRF Bob: inflated F yields false positives Alice cannot detect', () => {
    const A = ['alpha@x', 'beta@x', 'gamma@x'];
    const realB = ['delta@x']; // nothing in common with A
    const phantom = ['alpha@x', 'beta@x']; // Bob pretends to have these
    const r = simulateMaliciousOprfBob(A, realB, phantom, []);
    expect(r.honest.intersection).toEqual([]);
    expect(r.inflated.intersection.sort()).toEqual(['alpha@x', 'beta@x']);
    expect(r.inflated.falsePositives.sort()).toEqual(['alpha@x', 'beta@x']);
    // |F| of the inflated set MUST exceed |F| of the real set — that's the leak
    // Alice could observe IF she had pinned an out-of-band commitment.
    expect(r.inflated.publishedSize).toBeGreaterThan(r.honest.publishedSize);
  });

  it('malicious OPRF Bob: deflated F yields silent false negatives', () => {
    const A = ['alpha@x', 'beta@x'];
    const realB = ['alpha@x', 'beta@x', 'extra@x'];
    const drops = ['beta@x']; // Bob really has it, just doesn't publish its tag
    const r = simulateMaliciousOprfBob(A, realB, [], drops);
    expect(r.honest.intersection.sort()).toEqual(['alpha@x', 'beta@x']);
    expect(r.deflated.intersection.sort()).toEqual(['alpha@x']);
    expect(r.deflated.falseNegatives).toEqual(['beta@x']);
  });
});
