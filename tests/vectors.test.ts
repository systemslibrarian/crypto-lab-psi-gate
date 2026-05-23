/**
 * Canonical test vectors for PSI Gate v1.
 *
 * Locked byte-for-byte. Any change to:
 *   - hashToCurve (e.g., DST string)
 *   - ristretto255 encoding
 *   - OPRF H₂ construction
 * MUST be a deliberate version bump (PSI-GATE-v1 → v2) and a republished
 * TEST_VECTORS.md. These snapshots are the test that catches accidental drift.
 *
 * If you change the protocol on purpose: update TEST_VECTORS.md from the new
 * snapshot output, then re-run with `npm test -- -u` to regenerate.
 */
import { describe, it, expect } from 'vitest';
import { tracePSI } from '../src/psi.js';
import { scalarFromSeed, pointToHex } from '../src/group.js';
import { oprfBobSetup } from '../src/oprf-psi.js';

const TV_ALICE = ['alice@example.com', 'bob@example.com', 'mom@example.com'];
const TV_BOB = ['bob@example.com', 'mom@example.com', 'eve@example.com'];
const ALPHA = scalarFromSeed(
  '0000000000000000000000000000000000000000000000000000000000000007'
);
const BETA = scalarFromSeed(
  '000000000000000000000000000000000000000000000000000000000000000b'
);
const OPRF_K = scalarFromSeed(
  '000000000000000000000000000000000000000000000000000000000000000d'
);

describe('PSI-GATE-v1 canonical test vectors', () => {
  it('DH-PSI trace bytes are stable (snapshot)', () => {
    const trace = tracePSI(TV_ALICE, TV_BOB, ALPHA, BETA);
    const snapshot = {
      alpha: pointToHex(trace.aliceScalar),
      beta: pointToHex(trace.bobScalar),
      H_alice: trace.hashedAlice.map(pointToHex),
      H_bob: trace.hashedBob.map(pointToHex),
      X: trace.wireA2B_X.map(pointToHex),
      Y: trace.wireB2A_Y.map(pointToHex),
      Z: trace.wireB2A_Z.map(pointToHex),
      W: trace.computedW.map(pointToHex),
      intersection: [...trace.intersection].sort(),
    };
    expect(snapshot).toMatchSnapshot();
  });

  it('OPRF-PSI PRF tags are stable (snapshot)', () => {
    const bob = oprfBobSetup(TV_BOB, OPRF_K);
    const snapshot = {
      bobKey: pointToHex(bob.bobKey),
      publishedTagsSorted: [...bob.publishedSet].sort(),
    };
    expect(snapshot).toMatchSnapshot();
  });
});
