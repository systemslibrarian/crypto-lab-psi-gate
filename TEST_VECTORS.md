# PSI Gate v1 — Canonical Test Vectors

These vectors lock the byte-level output of PSI Gate v1. Any implementation
claiming "PSI-GATE-v1" compatibility MUST reproduce every hex string below
given the same fixed inputs and scalars.

The locked values are also asserted in `tests/__snapshots__/vectors.test.ts.snap`
so CI catches accidental drift. Changing any value is a protocol version bump.

## Suite parameters

| Parameter | Value |
|---|---|
| Group | ristretto255 (prime order, RFC 9496 canonical encoding) |
| Hash-to-curve | RFC 9380 expand_message_xmd over SHA-512 |
| Hash-to-curve DST | `PSI-GATE-v1-RISTRETTO255_XMD:SHA-512_R_` |
| OPRF H₂ | SHA-256 over (`PSI-GATE-v1-OPRF-H2` ‖ pointBytes) |
| Encoding | All hex is lowercase, big-endian, 32 bytes (64 chars) unless noted |

## Inputs (fixed)

```
A  = { "alice@example.com", "bob@example.com", "mom@example.com" }   // ordered
B  = { "bob@example.com",   "mom@example.com", "eve@example.com" }   // ordered
α  = scalarFromSeed("0000…0007")  // Alice's blinding scalar
β  = scalarFromSeed("0000…000b")  // Bob's blinding scalar
k  = scalarFromSeed("0000…000d")  // Bob's OPRF key (OPRF-PSI only)
```

Concrete scalars (32 bytes, big-endian):

```
α = 0000000000000000000000000000000000000000000000000000000000000007
β = 000000000000000000000000000000000000000000000000000000000000000b
k = 000000000000000000000000000000000000000000000000000000000000000d
```

Expected intersection: `{ "bob@example.com", "mom@example.com" }`.

## DH-PSI trace (no shuffling — `tracePSI`)

### Hashed inputs (not on wire)

```
H(a₁) = a065fed2561a32fa5d398671bbec019264899edf84d068c15e6b7ea3c45e9768   // "alice@example.com"
H(a₂) = aabc0b23143f1134ae91cc55ba6a1636dc7cea43cf1d19b9522203d8c64ec817   // "bob@example.com"
H(a₃) = 9c4989cbd998ba6adfbceb380ffb076e1ffced9ba9eea68c2f47e6fa984d7801   // "mom@example.com"

H(b₁) = aabc0b23143f1134ae91cc55ba6a1636dc7cea43cf1d19b9522203d8c64ec817   // "bob@example.com"   = H(a₂)
H(b₂) = 9c4989cbd998ba6adfbceb380ffb076e1ffced9ba9eea68c2f47e6fa984d7801   // "mom@example.com"   = H(a₃)
H(b₃) = a268f902bf950fa05d657abef1d41a39962804c5fd7d9694c8370caeeffa1f56   // "eve@example.com"
```

### Round 1 (A → B): Xᵢ = α · H(aᵢ)

```
X₁ = 90e62d0fc3810702591256866c63d79e0e9c7f00f39b51834487715b71fb8443
X₂ = 5c8abe9f33ef4d8e2b87d502ab93aff202b2851e41e0c429c568bd0621559348
X₃ = ce5c32a65c19bb5046db44a47623bfb499b8cfb2316c62bb51a739c5b17f875e
```

### Round 2 (B → A): Yᵢ = β · Xᵢ, Zⱼ = β · H(bⱼ)

```
Y₁ = 046a9935ec7b0f99a4d71460173abfbcee28826a1616476b7e2b15a14e1d192b
Y₂ = 501624bf6cc46293e150b2a0192cfa8872f606e0608de02fda1bf6875cde9a21
Y₃ = a4269c9c60351558ff9f2a48cb8705faa319739e0d0c647fe0dba2bb56036e78

Z₁ = 1ca02e3a943522609225cbb80658cba386ace645f002db5a3c05533f4a976921
Z₂ = 988bd19413b22a2f648873598c09cca090fa292723ad55a92a6fcc5c6686dc1f
Z₃ = cc3beab3bb8ff2a367cdaf05433c312c5cdbbacb0de2f0ea6b5ca0e7aa559a41
```

### Round 3 (local to Alice): Wⱼ = α · Zⱼ

```
W₁ = 501624bf6cc46293e150b2a0192cfa8872f606e0608de02fda1bf6875cde9a21   // = Y₂  (bob matches)
W₂ = a4269c9c60351558ff9f2a48cb8705faa319739e0d0c647fe0dba2bb56036e78   // = Y₃  (mom matches)
W₃ = b8dbfbeea47d0478aad94f57ccb582a55811689ce9a5fddade6524bf773c2918   // no match (eve ∉ A)
```

Alice computes the intersection by membership test `Yᵢ ∈ {Wⱼ}`:
- `Y₂ = W₁` → `a₂ = "bob@example.com"` is in the intersection
- `Y₃ = W₂` → `a₃ = "mom@example.com"` is in the intersection
- `Y₁ ∉ {Wⱼ}` → `a₁ = "alice@example.com"` is NOT in the intersection

## OPRF-PSI canonical PRF tags

Bob's published set F = `{ H₂(k · H(bⱼ)) for bⱼ ∈ B }`, where H₂ is the
domain-separated SHA-256 described above. Set ordering is lexicographic
because F is a set (order does not affect the protocol).

```
F = {
  "d1498f668e0a09acdcded4faea70f23c75d26b0b25c75370e0e3a9702cd99709",
  "d489aedc9cc6e741d7659cc3bc431f5b416c5ea1728fd2278052f870a9253ef1",
  "f6a3d5d406a4b4df85031f0a09c54793c82256742a6be544b41fe70508af65df",
}
```

## Reproducing locally

```sh
npm test -- tests/vectors.test.ts
```

If your implementation matches PSI-GATE-v1, every hex string above will be
identical. Any divergence is either a bug or a deliberate version bump.
