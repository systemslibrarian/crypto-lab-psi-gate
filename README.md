# PSI Gate — Private Set Intersection

> "Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God."
> — 1 Corinthians 10:31

## What It Is

Browser-based Private Set Intersection (PSI) demo implementing the classic
Diffie-Hellman-based PSI protocol (Meadows 1986, Huberman-Franklin-Hogg 1999).
Two parties compute `A ∩ B` without revealing non-matching elements to each other.

Uses **ristretto255** via `@noble/curves` for DDH-hard group operations and
RFC 9380-compliant hash-to-curve. Demonstrates the three-round interactive protocol,
side-by-side comparison of what each party learns, and three realistic attack scenarios
(set size inflation, dictionary attacks, scalar reuse) with honest discussion of PSI's
limitations. All cryptography runs in-browser — no backends, no servers.

## When to Use It

- Understanding the cryptographic primitive behind Signal contact discovery, Apple
  password monitoring, and Google's Private Join and Compute
- Teaching how two parties can compute a joint function without revealing inputs
  (the essence of secure two-party computation)
- Learning why the Decisional Diffie-Hellman (DDH) assumption matters for PSI
  correctness and privacy
- Evaluating PSI for contact discovery, password breach checking, ad attribution,
  or healthcare data sharing applications

**Not for:** production PSI implementations. This demo is semi-honest secure only and
doesn't include the rate limiting, proof-of-work, or set size hiding needed for
real deployment. Use Signal's OPRF-based PSI or Google's Private Join and Compute
library for production use.

## Live Demo

https://systemslibrarian.github.io/crypto-lab-psi-gate/

## The DH-PSI Protocol

```
Group G with generator g, prime order q (ristretto255).
Hash function H: {0,1}* → G  (hash-to-curve, RFC 9380)

Alice has A = {a_1, ..., a_n}
Bob   has B = {b_1, ..., b_m}

Round 1 (Alice):  Pick random α.  Send X_i = α·H(a_i) shuffled.
Round 2 (Bob):    Pick random β.  Send Y_i = β·X_i and Z_j = β·H(b_j) shuffled.
Round 3 (Alice):  Compute W_j = α·Z_j.  Intersection = {a_i : Y_i ∈ {W_j}}.
```

**Why it works:** Both α and β are applied to matched elements, giving the same
`αβ·H(x)` regardless of order (DDH commutativity). Non-matched elements look random.

## Six Exhibits

| # | Exhibit | What you see |
|---|---------|--------------|
| 1 | Contact Discovery Problem | PrayerWarriors.Mobi scenario; naive vs PSI approach |
| 2 | Protocol Walkthrough | Step-by-step with animated blinding/unblinding |
| 3 | Live Simulator | Paste your own sets; run PSI instantly |
| 4 | Attack Demos | Set size inflation, dictionary attack, scalar reuse, malformed-point injection |
| 5 | Real-World Deployments | Signal, Apple, Google, DP3T, healthcare |
| 6 | Cryptographer's Lab | Test vectors, wire transcript, benchmarks, security argument, PSI protocol comparison |

### Cryptographer's Lab (Exhibit 6)

For reviewers and implementers who need byte-level rigor:

- **Canonical test vectors** — fixed inputs (α seed = `…0007`, β seed = `…000b`,
  A = `{alice,bob,mom}@example.com`, B = `{bob,mom,eve}@example.com`) produce a
  deterministic trace. Any conforming DH-PSI/ristretto255 implementation must
  reproduce every H(x), X_i, Y_i, Z_j, and W_j byte-for-byte.
- **Wire-format transcript** — every ristretto point on the wire as a 32-byte
  hex dump, color-coded by sender. Verifies linear O(n+m) communication.
- **Benchmarks** — live measurement of `hashToPoint`, `scalarMul`,
  `randomScalar`, and end-to-end PSI at multiple set sizes in your browser.
- **Simulator-based security argument** — sketches of the simulators for
  corrupt Alice and corrupt Bob under DDH; honest list of what this
  implementation is NOT (constant-time, malicious-secure, side-channel hardened,
  formally verified).
- **Protocol comparison** — DH-PSI vs OPRF-PSI vs KKRT16 vs CM20 vs PaXoS/VOLE-PSI
  vs FHE-PSI, with communication, computation, security model, and year.

## What Can Go Wrong

- **Set sizes are revealed.** Both parties learn how many elements the other has.
  Hiding set sizes requires more sophisticated protocols (PaXoS, CM20).

- **Dictionary attacks work against small domains.** If elements come from a small
  domain (phone numbers, PINs), an attacker can enumerate the entire space and learn
  your full set. Real deployments add rate limiting, proof-of-work, or OPRF.

- **Scalar reuse is catastrophic.** If Alice reuses α across sessions with Bob, Bob
  can link sessions and detect which elements changed. Fresh α per session is mandatory.

- **Semi-honest security only.** The protocol assumes both parties follow it honestly.
  An actively malicious party can deviate — submit malformed points, reuse scalars
  intentionally, or lie about results. Malicious-security PSI requires additional ZK proofs.

- **Inherent information leakage.** Even a perfect PSI tells Alice which of her elements
  are in Bob's set. That fact alone may be sensitive depending on context.

## Real-World Usage

The DH-PSI protocol dates to Meadows 1986 and was analyzed by Huberman, Franklin, and
Hogg (1999). Production deployments:

- **Signal** — contact discovery via SGX enclave + OPRF-based PSI
- **Apple iOS 14+** — Password Monitoring against breach databases
- **Google Password Checkup** — 4B+ leaked credentials, blind hashing + k-anonymity
- **Google Private Join and Compute** — ad conversion attribution (open-source)
- **Meta Private Lift** — advertising measurement without user-level data sharing
- **DP3T / Google-Apple Exposure Notification** — COVID contact tracing
- **Healthcare** — cross-hospital duplicate billing detection

Modern high-performance PSI (KKRT16, PaXoS, VOLE-PSI) builds on oblivious PRF
from oblivious transfer. The group used here (ristretto255) is the same prime-order
abstraction behind Signal Double Ratchet and X25519.

## Stack

- **Vite + TypeScript strict** — `noUnusedLocals`, `noUnusedParameters`, full strict mode
- **`@noble/curves`** — ristretto255 via `ristretto255_hasher` (RFC 9380 hash-to-curve, RFC 9496 ristretto encoding)
- **Vitest + GitHub Actions** — golden test vectors, randomized property tests, CI on Node 20 + 22
- **Web Worker offload** — `src/psi-worker.ts` keeps the UI responsive during 1k+ PSI runs and DDH sampling
- **CSP-hardened** — hash-pinned inline script, no remote sources, `worker-src 'self' blob:`
- **No backends, no server** — GitHub Pages static deployment
- **No `Math.random()`** — all randomness via `crypto.getRandomValues`

## Protocols

Two interoperating protocols are implemented and can be toggled in Exhibit 3:

- **DH-PSI** (`src/psi.ts`) — the three-round Meadows/HFH protocol; pedagogical baseline.
- **OPRF-PSI** (`src/oprf-psi.ts`) — Jarecki-Liu 2010; what Signal contact discovery uses
  in spirit. Bob publishes PRF tags once, Alice queries with a per-query α, unblinds with α⁻¹.

## Testing

```
npm test          # Vitest run (26 tests: group ops, DH-PSI, OPRF-PSI, attacks, test vectors)
npm run test:watch
```

CI runs on every push/PR via `.github/workflows/test.yml`:
typecheck → tests → production build, on Node 20 and 22.

## Related Crypto Labs

```
crypto-lab-opaque-gate       — aPAKE (authentication, related primitive)
crypto-lab-silent-tally      — private aggregation
crypto-lab-blind-oracle      — TFHE (general-purpose PSI via FHE)
crypto-lab-oblivious-shelf   — PIR (private information retrieval)
crypto-lab-patron-shield     — privacy-preserving analytics
crypto-lab-paillier-gate     — Paillier (used in some PSI variants)
crypto-lab-ot-gate           — oblivious transfer (used in OPRF-PSI)
```

## GitHub Topics

`cryptography` `private-set-intersection` `psi` `secure-computation`
`contact-discovery` `ristretto255` `diffie-hellman` `ddh` `signal-protocol`
`privacy-preserving` `browser-demo` `educational` `typescript` `vite`
