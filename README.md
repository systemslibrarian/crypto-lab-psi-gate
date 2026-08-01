# crypto-lab-psi-gate

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

- Understanding the cryptographic primitive behind Apple password monitoring and
  Google's Private Join and Compute — and the pure-cryptography alternative to how
  Signal solves contact discovery (Signal uses SGX enclaves plus ORAM, not PSI)
- Teaching how two parties can compute a joint function without revealing inputs
  (the essence of secure two-party computation)
- Learning why the Decisional Diffie-Hellman (DDH) assumption matters for PSI
  correctness and privacy
- Evaluating PSI for contact discovery, password breach checking, ad attribution,
  or healthcare data sharing applications
- Do NOT use this for production PSI — this demo is semi-honest secure only and
  doesn't include the rate limiting, proof-of-work, or set size hiding needed for
  real deployment. Use a maintained library such as Google's Private Join and Compute
  for production use.

## Live Demo

**[systemslibrarian.github.io/crypto-lab-psi-gate](https://systemslibrarian.github.io/crypto-lab-psi-gate/)**

The page runs the full three-round DH-PSI protocol in the browser across six exhibits: a contact-discovery scenario contrasting naive hashing with PSI, a step-by-step protocol walkthrough (opening with a plain-language "blinding as a padlock" primer, then following each email as a stable colour-and-icon chip through H(x) → single-blind → double-blind until the two independently-blinded paths of a shared element visibly snap onto the same byte-identical point), a live simulator where you paste your own sets and see a side-by-side alignment grid of the double-blinded values matching row by row, attack demos (set-size inflation, dictionary attacks, scalar reuse, malformed-point injection), a real-world deployments tour, and a Cryptographer's Lab with canonical test vectors, a byte-level wire transcript, live benchmarks, and a simulator-based security argument. All cryptography runs client-side with no servers.

## What Can Go Wrong

- **Set sizes are revealed.** Both parties learn how many elements the other has.
  Hiding set sizes requires more sophisticated protocols (PaXoS, CM20).

- **Dictionary attacks work against small domains.** If elements come from a small
  domain (phone numbers, PINs), an attacker can enumerate the entire space and learn
  your full set. Real deployments add rate limiting, proof-of-work, or OPRF.

- **Scalar reuse is catastrophic.** If Alice reuses α across sessions with Bob, Bob
  can link sessions and detect which elements changed. Fresh α per session is mandatory.

- **Semi-honest security only.** The protocol assumes both parties follow it honestly.
  An actively malicious party can deviate — reuse scalars intentionally, inflate or
  deflate its set, or lie about results. Malicious-security PSI requires additional
  ZK proofs. Received-point validation *is* implemented on every receive path, so a
  malformed or identity encoding aborts rather than corrupting the run; that closes
  one specific active attack, not the model.

- **Inherent information leakage.** Even a perfect PSI tells Alice which of her elements
  are in Bob's set. That fact alone may be sensitive depending on context.

## Real-World Usage

The DH-PSI protocol dates to Meadows 1986 and was analyzed by Huberman, Franklin, and
Hogg (1999). Production deployments:

- **Apple iOS 14+** — Password Monitoring against breach databases
- **Google Password Checkup** — 4B+ leaked credentials, blind hashing + k-anonymity
- **Google Private Join and Compute** — ad conversion attribution (open-source)
- **Meta Private Lift** — advertising measurement without user-level data sharing
- **Healthcare** — cross-hospital duplicate billing detection

Two systems commonly filed under PSI that do not actually use it, and are worth
knowing as contrasts:

- **Signal contact discovery** — solves the same problem with Intel SGX enclaves and
  an ORAM lookup, not a PSI protocol. Signal's own writeup names private set
  intersection among the options that "don't work" for them, alongside bloom filters
  and PIR ([Private Contact Discovery](https://signal.org/blog/private-contact-discovery/)).
- **DP3T / Google-Apple Exposure Notification** — rolling proximity identifiers are
  HKDF-derived from daily keys and re-derived locally on-device from downloaded
  diagnosis keys. Decentralized, but no two-party intersection protocol runs.

Modern high-performance PSI (KKRT16, PaXoS, VOLE-PSI) builds on oblivious PRF
from oblivious transfer. The group used here (ristretto255) is the same prime-order
abstraction behind Signal Double Ratchet and X25519.

## How to Run Locally

```bash
git clone https://github.com/systemslibrarian/crypto-lab-psi-gate
cd crypto-lab-psi-gate
npm install
npm run dev
```

## Related Demos
- [crypto-lab-opaque-gate](https://systemslibrarian.github.io/crypto-lab-opaque-gate/) — OPAQUE aPAKE built on an OPRF, the same primitive that hardens production PSI.
- [crypto-lab-ot-gate](https://systemslibrarian.github.io/crypto-lab-ot-gate/) — oblivious transfer, the foundation of modern high-performance OPRF-based PSI.
- [crypto-lab-oblivious-shelf](https://systemslibrarian.github.io/crypto-lab-oblivious-shelf/) — private information retrieval, a neighboring "query without revealing" primitive.
- [crypto-lab-paillier-gate](https://systemslibrarian.github.io/crypto-lab-paillier-gate/) — Paillier additive homomorphic encryption, used in some PSI and private-aggregation variants.
- [crypto-lab-silent-tally](https://systemslibrarian.github.io/crypto-lab-silent-tally/) — private aggregation over secret-shared inputs, another two-party privacy computation.

## The DH-PSI Protocol

```
Group G with generator g, prime order q (ristretto255).
Hash function H: {0,1}* → G  (hash-to-curve, RFC 9380)

Alice has A = {a_1, ..., a_n}
Bob   has B = {b_1, ..., b_m}

Round 1 (Alice):  Pick random α.  Send X_i = α·H(a_i) shuffled.
Round 2 (Bob):    Validate every X_i.  Pick random β.
                  Send Y_i = β·X_i and Z_j = β·H(b_j) shuffled.
Round 3 (Alice):  Validate every Y_i and Z_j.  Compute W_j = α·Z_j.
                  Intersection = {a_i : Y_i ∈ {W_j}}.
```

Validation is `isValidPoint` and it runs on every point that arrives from the
counterparty, in both DH-PSI (`psi.ts`) and OPRF-PSI (`oprf-psi.ts`), before any
scalar touches it. Ristretto255 makes non-canonical encodings and torsion points
undecodable, but the identity O is a perfectly valid encoding, and β·O = O would
collapse every Y_i to a single point. That one is caught only by the check.
Exhibit 4's injection probe feeds each malicious encoding through `bobRound2`
itself and reports what the protocol did with it.

**Why it works:** A shared element gets both α and β applied to it, and scalar
multiplication is commutative — `β·(α·H(x)) = α·(β·H(x)) = αβ·H(x)` — so Alice's
`Y_i` and Bob's `W_j` for that element are the *same curve point, byte-for-byte*.
That collision is the intersection. Non-matched elements never receive both
scalars, so they stay random and never collide. Exhibit 2 lets you watch the two
blinding orders converge onto that identical point; the DDH assumption is what
makes every non-colliding point unlinkable to its plaintext.

## Six Exhibits

| # | Exhibit | What you see |
|---|---------|--------------|
| 1 | Contact Discovery Problem | PrayerWarriors.Mobi scenario; naive vs PSI approach |
| 2 | Protocol Walkthrough | Plain-language padlock primer, then each email tracked as a stable colour/icon chip through H(x) → single- → double-blind, until the two blinding orders of a shared element snap onto the same byte-identical point |
| 3 | Live Simulator | Paste your own sets; run PSI instantly, with a side-by-side alignment grid of double-blinded values (from the same execution as the result above it) and a reveal-plaintext toggle |
| 4 | Attack Demos | Set size inflation, dictionary attack, scalar reuse, malformed-point injection (each candidate encoding fed through `psi.ts`'s real receive path, not just through `isValidPoint`), malicious OPRF publication |
| 5 | Real-World Deployments | Apple, Google, Meta, healthcare — plus Signal and DP3T as non-PSI contrasts |
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
- **DDH pseudorandomness sampler** — bins the output bytes of α·H(x) over 5,000
  fresh inputs and runs a two-sided χ² test against uniform (df = 255, exact
  quantiles for α = 0.05 and α = 0.01). Byte positions 1–30 carry the test; byte
  0 and byte 31 are charted *separately* because RFC 9496 pins them — a ristretto
  encoding is the canonical encoding of an even field element below 2²⁵⁵ − 19, so
  byte 0 is always even and byte 31 never reaches `0x80`. Both constraints are
  measured on each run rather than asserted. Pooling all 32 positions is what
  makes a "flatness" test fail on correct data, and the sharper lesson is the
  one the panel states: pseudorandomness of the group element is not uniformity
  of its encoding.
- **Simulator-based security argument** — sketches of the simulators for
  corrupt Alice and corrupt Bob under DDH; honest list of what this
  implementation is NOT (constant-time, malicious-secure, side-channel hardened,
  formally verified).
- **Protocol comparison** — DH-PSI vs OPRF-PSI vs KKRT16 vs CM20 vs PaXoS/VOLE-PSI
  vs FHE-PSI, with communication, computation, security model, and year.

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
- **OPRF-PSI** (`src/oprf-psi.ts`) — Jarecki-Liu 2010; the academic route to contact
  discovery, as opposed to Signal's enclave-based one
  in spirit. Bob publishes PRF tags once, Alice queries with a per-query α, unblinds with α⁻¹.

## Testing

```
npm test          # Vitest run (32 tests: group ops, DH-PSI, OPRF-PSI, attacks, test vectors)
npm run test:watch
```

CI runs on every push/PR via `.github/workflows/test.yml`:
typecheck → tests → production build, on Node 20 and 22.

## GitHub Topics

`cryptography` `private-set-intersection` `psi` `secure-computation`
`contact-discovery` `ristretto255` `diffie-hellman` `ddh` `signal-protocol`
`privacy-preserving` `browser-demo` `educational` `typescript` `vite`

---

*One of 170+ browser demos in the [Crypto Lab](https://crypto-lab.systemslibrarian.dev/) suite.*

*"So whether you eat or drink or whatever you do, do it all for the glory of God." — 1 Corinthians 10:31*
