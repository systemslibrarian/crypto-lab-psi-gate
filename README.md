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

## Five Exhibits

| # | Exhibit | What you see |
|---|---------|--------------|
| 1 | Contact Discovery Problem | PrayerWarriors.Mobi scenario; naive vs PSI approach |
| 2 | Protocol Walkthrough | Step-by-step with animated blinding/unblinding |
| 3 | Live Simulator | Paste your own sets; run PSI instantly |
| 4 | Attack Demos | Set size inflation, dictionary attack, scalar reuse |
| 5 | Real-World Deployments | Signal, Apple, Google, DP3T, healthcare |

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
- **`@noble/curves`** — ristretto255 via `ristretto255_hasher` (RFC 9380 hash-to-curve)
- **No backends, no server** — GitHub Pages static deployment
- **No `Math.random()`** — all randomness via `crypto.getRandomValues`

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
