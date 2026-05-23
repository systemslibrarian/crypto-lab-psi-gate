import './style.css';
import {
  runPSI,
  aliceRound1,
  bobRound2,
  aliceRound3,
  verifyCorrectness,
  tracePSI,
} from './psi.js';
import {
  hashToPoint,
  pointToHex,
  randomScalar,
  scalarFromSeed,
  scalarMul,
} from './group.js';
import {
  simulateSetSizeInflation,
  simulateDictionaryAttack,
  simulateReplayAttack,
  simulateMalformedPointInjection,
} from './attacks.js';
import { runOPRFPSI } from './oprf-psi.js';
import { callWorker, workerSupported } from './worker-client.js';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncateHex(h: string, n = 16): string {
  return h.slice(0, n) + '…';
}

// ---------------------------------------------------------------------------
// Theme toggle
// ---------------------------------------------------------------------------

function initThemeToggle(): void {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-toggle';
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '☀ / ☾';
  btn.appendChild(icon);
  const updateLabel = (): void => {
    const current = document.documentElement.getAttribute('data-theme') ?? 'dark';
    const label = `Switch to ${current === 'dark' ? 'light' : 'dark'} theme`;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  };
  updateLabel();
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateLabel();
  });
  document.body.appendChild(btn);
}

// ---------------------------------------------------------------------------
// Tab routing (ARIA-compliant with keyboard navigation)
// ---------------------------------------------------------------------------

function initTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

  function activateTab(tab: HTMLButtonElement): void {
    tabs.forEach((t) => {
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    panels.forEach((p) => p.classList.remove('active'));
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    tab.focus();
    const controls = tab.getAttribute('aria-controls');
    if (controls) document.getElementById(controls)?.classList.add('active');
  }

  tabs.forEach((btn, i) => {
    btn.addEventListener('click', () => activateTab(btn));
    btn.addEventListener('keydown', (e: KeyboardEvent) => {
      let next = -1;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next !== -1) { e.preventDefault(); activateTab(tabs[next]); }
    });
  });
}

// ---------------------------------------------------------------------------
// Exhibit 1 — Contact Discovery Problem
// ---------------------------------------------------------------------------

function initExhibit1(): void {
  const runBtn = document.getElementById('e1-run') as HTMLButtonElement;
  const aliceList = document.getElementById('e1-alice-list') as HTMLUListElement;
  const bobList = document.getElementById('e1-bob-list') as HTMLUListElement;
  const output = document.getElementById('e1-output') as HTMLDivElement;

  const aliceContacts = [
    'prayer.partner@example.com',
    'mom@gmail.com',
    'friend.alex@email.com',
    'pastor.john@church.org',
    'colleague@work.com',
    'neighbor.smith@example.com',
    'sister.mary@example.com',
    'youth.leader@church.org',
  ];

  const serverUsers = [
    'prayer.partner@example.com',
    'friend.alex@email.com',
    'youth.leader@church.org',
    'random.user1@example.com',
    'random.user2@example.com',
    'another.user@example.com',
    'pastor.john@church.org',
  ];

  // Render initial lists
  aliceList.innerHTML = aliceContacts
    .map((c) => `<li class="no-match">${esc(c)}</li>`)
    .join('');
  bobList.innerHTML = serverUsers
    .map((u) => `<li class="no-match">${esc(u)}</li>`)
    .join('');

  runBtn.addEventListener('click', () => {
    runBtn.disabled = true;
    runBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span class="sr-only">Running PSI…</span> Running PSI…';

    // Defer to allow UI to update
    setTimeout(() => {
      const result = runPSI(aliceContacts, serverUsers);
      const intersectionSet = new Set(result.intersection);

      // Update Alice's list
      aliceList.innerHTML = aliceContacts
        .map((c) => {
          const cls = intersectionSet.has(c) ? 'match' : 'no-match';
          return `<li class="${cls}">${esc(c)}</li>`;
        })
        .join('');

      output.innerHTML = `
        <div class="result-box">
          <div class="info-grid">
            <span class="info-label">Intersection found:</span>
            <span class="info-value match">${result.intersectionSize} contact(s)</span>
            <span class="info-label">Alice's contacts:</span>
            <span class="info-value alice">${aliceContacts.length} (server never saw them)</span>
            <span class="info-label">Server database:</span>
            <span class="info-value bob">${serverUsers.length} users (Alice never downloaded it)</span>
          </div>
          <div style="margin-top:0.75rem">
            ${result.intersection.map((el) => `<div class="intersection-item">${esc(el)}</div>`).join('')}
          </div>
          <div class="status ok" style="margin-top:0.75rem">
            ✓ PSI complete — only matching contacts revealed. Neither party learned anything else.
          </div>
        </div>`;

      runBtn.disabled = false;
      runBtn.textContent = 'Run PSI Again';
    }, 50);
  });
}

// ---------------------------------------------------------------------------
// Exhibit 2 — Protocol Walkthrough
// ---------------------------------------------------------------------------

function initExhibit2(): void {
  const aliceSet = ['alice@example.com', 'mom@gmail.com', 'bob@example.com'];
  const bobSet = ['bob@example.com', 'charlie@example.com', 'dave@example.com'];

  let step = 0;
  let r1: ReturnType<typeof aliceRound1> | null = null;
  let r2: ReturnType<typeof bobRound2> | null = null;

  const panel = document.getElementById('e2-panel') as HTMLDivElement;
  const prevBtn = document.getElementById('e2-prev') as HTMLButtonElement;
  const nextBtn = document.getElementById('e2-next') as HTMLButtonElement;
  const stepCounter = document.getElementById('e2-step') as HTMLSpanElement;

  const steps: Array<() => string> = [
    // Step 0 — Setup
    () => `
      <h3><span class="step-counter" aria-hidden="true">0</span>Setup</h3>
      <div class="card-row">
        <div>
          <div class="set-label alice">Alice's Set A</div>
          <ul class="element-list">
            ${aliceSet.map((el) => `<li>${esc(el)}</li>`).join('')}
          </ul>
        </div>
        <div>
          <div class="set-label bob">Bob's Set B</div>
          <ul class="element-list">
            ${bobSet.map((el) => `<li>${esc(el)}</li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="status info" style="margin-top:1rem">
        Group: ristretto255 (prime-order, DDH-hard). Hash-to-curve: RFC 9380.
        Expected intersection: { bob@example.com }
      </div>`,

    // Step 1 — Alice Round 1
    () => {
      r1 = aliceRound1(aliceSet);
      const scalarHex = Array.from(r1.aliceScalar)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return `
        <h3><span class="step-counter" aria-hidden="true">1</span>Alice — Round 1: Blind her elements</h3>
        <p>Alice picks a fresh random scalar α and computes X_i = α · H(a_i) for each element.</p>
        <div class="card">
          <div class="info-grid">
            <span class="info-label">α (private, NEVER sent):</span>
            <button type="button" class="scalar-btn" aria-pressed="false"
              aria-label="Reveal private scalar α (currently hidden — click to toggle)">
              <span data-hex aria-hidden="true">${scalarHex}</span>
            </button>
          </div>
        </div>
        <div class="set-label alice" style="margin-top:0.75rem">Blinded elements X_i = α · H(a_i) sent to Bob:</div>
        <ul class="element-list">
          ${r1.blindedElements
            .map((pt, i) => `<li class="blinded" title="Blinded(${esc(aliceSet[i])})">X_${i+1} = ${truncateHex(pointToHex(pt))}</li>`)
            .join('')}
        </ul>
        <div class="status info">Bob sees 3 random-looking curve points. He cannot recover Alice's emails.</div>`;
    },

    // Step 2 — Bob Round 2
    () => {
      if (!r1) return '<p class="status error">Run Step 1 first</p>';
      r2 = bobRound2(r1, bobSet);
      const bScalarHex = Array.from(r2.bobScalar)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return `
        <h3><span class="step-counter" aria-hidden="true">2</span>Bob — Round 2: Double-blind + blind his own</h3>
        <p>Bob picks fresh β, computes Y_i = β · X_i (double-blinded Alice's), and Z_j = β · H(b_j) (his own).</p>
        <div class="card">
          <div class="info-grid">
            <span class="info-label">β (private, NEVER sent):</span>
            <button type="button" class="scalar-btn" aria-pressed="false"
              aria-label="Reveal private scalar β (currently hidden — click to toggle)">
              <span data-hex aria-hidden="true">${bScalarHex}</span>
            </button>
          </div>
        </div>
        <div class="card-row">
          <div>
            <div class="set-label" style="color:var(--double-blinded)">Y_i = β · X_i (sent to Alice)</div>
            <ul class="element-list">
              ${r2.doubleBlindedAliceElements
                .map((pt) => `<li class="double-blinded">Y = ${truncateHex(pointToHex(pt))}</li>`)
                .join('')}
            </ul>
          </div>
          <div>
            <div class="set-label bob">Z_j = β · H(b_j) (sent to Alice, shuffled)</div>
            <ul class="element-list">
              ${r2.bobBlindedElements
                .map((pt) => `<li class="blinded">Z = ${truncateHex(pointToHex(pt))}</li>`)
                .join('')}
            </ul>
          </div>
        </div>
        <div class="status info">Alice can't learn Bob's emails. Bob can't link Y_i back to Alice's emails.</div>`;
    },

    // Step 3 — Alice Round 3
    () => {
      if (!r1 || !r2) return '<p class="status error">Run Steps 1 & 2 first</p>';
      const result = aliceRound3(r1, r2, aliceSet);
      return `
        <h3><span class="step-counter" aria-hidden="true">3</span>Alice — Round 3: Double-blind Bob's and match</h3>
        <p>Alice computes W_j = α · Z_j = αβ · H(b_j). Then checks if any Y_i equals some W_j.</p>
        <div class="set-label" style="color:var(--double-blinded)">W_j = α · Z_j (αβ · H(b_j))</div>
        <ul class="element-list" style="margin-bottom:0.75rem">
          ${r2.bobBlindedElements
            .map((Z, j) => {
              const W = scalarMul(r1!.aliceScalar, Z);
              return `<li class="double-blinded">W_${j+1} = ${truncateHex(pointToHex(W))}</li>`;
            })
            .join('')}
        </ul>
        <div class="status ok">
          Intersection (Y_i matched some W_j):
          ${result.intersection.length > 0
            ? result.intersection.map((el) => `<div class="intersection-item">${esc(el)}</div>`).join('')
            : '<span style="color:var(--text-muted)">∅ (empty)</span>'}
        </div>
        <div class="info-grid" style="margin-top:0.75rem">
          <span class="info-label">Alice learned Bob's set size:</span>
          <span class="info-value bob">${result.aliceLearnedBobSize}</span>
          <span class="info-label">Bob learned Alice's set size:</span>
          <span class="info-value alice">${result.bobLearnedAliceSize}</span>
        </div>`;
    },

    // Step 4 — Verification
    () => {
      if (!r1 || !r2) return '<p class="status error">Run Steps 1-3 first</p>';
      const result = aliceRound3(r1, r2, aliceSet);
      const check = verifyCorrectness(aliceSet, bobSet, result);
      return `
        <h3><span class="step-counter" aria-hidden="true">4</span>Verification</h3>
        <p>Compare PSI output to the plain-text intersection (honest verifier check — not a security feature).</p>
        <div class="card">
          <div class="info-grid">
            <span class="info-label">Expected intersection:</span>
            <span class="info-value match">${check.expected.join(', ') || '∅'}</span>
            <span class="info-label">PSI intersection:</span>
            <span class="info-value match">${check.actual.join(', ') || '∅'}</span>
            <span class="info-label">Correct:</span>
            <span class="info-value ${check.matches ? 'match' : 'private'}">${check.matches ? '✓ YES' : '✗ NO'}</span>
          </div>
        </div>
        <div class="status ok">
          The DH-PSI protocol correctly computed A ∩ B without either party
          revealing their non-intersection elements.
        </div>`;
    },
  ];

  function render(): void {
    panel.innerHTML = steps[step]();
    stepCounter.textContent = `Step ${step + 1} / ${steps.length}`;
    prevBtn.disabled = step === 0;
    nextBtn.disabled = step === steps.length - 1;
  }

  prevBtn.addEventListener('click', () => { if (step > 0) { step--; render(); } });
  nextBtn.addEventListener('click', () => { if (step < steps.length - 1) { step++; render(); } });

  render();
}

// ---------------------------------------------------------------------------
// Exhibit 3 — Live Simulator
// ---------------------------------------------------------------------------

function initExhibit3(): void {
  const aliceTa = document.getElementById('e3-alice') as HTMLTextAreaElement;
  const bobTa = document.getElementById('e3-bob') as HTMLTextAreaElement;
  const runBtn = document.getElementById('e3-run') as HTMLButtonElement;
  const output = document.getElementById('e3-output') as HTMLDivElement;

  aliceTa.value = [
    'alice.friend@gmail.com',
    'workmate@example.com',
    'mom@example.com',
    'pastor@church.org',
    'neighbor@example.com',
    'prayer.circle@example.com',
    'book.club@example.com',
    'cousin@example.com',
    'mentor@example.com',
    'colleague.bob@work.com',
  ].join('\n');

  bobTa.value = [
    'alice.friend@gmail.com',
    'workmate@example.com',
    'pastor@church.org',
    'prayer.circle@example.com',
    'random.server.user1@example.com',
    'random.server.user2@example.com',
    'another.user@example.com',
    'server.only@example.com',
    'database.user@example.com',
    'app.user@example.com',
  ].join('\n');

  runBtn.addEventListener('click', () => {
    const aliceSet = aliceTa.value.split('\n').map((s) => s.trim()).filter(Boolean);
    const bobSet = bobTa.value.split('\n').map((s) => s.trim()).filter(Boolean);

    if (aliceSet.length === 0 || bobSet.length === 0) {
      output.innerHTML = '<div class="status error">Both sets must be non-empty.</div>';
      return;
    }

    const proto =
      (document.querySelector<HTMLInputElement>(
        'input[name="e3-proto"]:checked'
      )?.value ?? 'dh') === 'oprf'
        ? 'oprf'
        : 'dh';
    const protoLabel = proto === 'oprf' ? 'OPRF-PSI (Jarecki-Liu)' : 'DH-PSI (Meadows)';

    runBtn.disabled = true;
    runBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span class="sr-only">Running…</span> Running…';
    output.innerHTML = `<div class="status info" role="status">Running ${protoLabel} (${aliceSet.length} × ${bobSet.length} elements)…</div>`;

    setTimeout(() => {
      const result =
        proto === 'oprf' ? runOPRFPSI(aliceSet, bobSet) : runPSI(aliceSet, bobSet);
      const check = verifyCorrectness(aliceSet, bobSet, result);

      output.innerHTML = `
        <div class="result-box">
          <div class="info-grid">
            <span class="info-label">Alice's elements:</span>
            <span class="info-value alice">${aliceSet.length}</span>
            <span class="info-label">Bob's elements:</span>
            <span class="info-value bob">${bobSet.length}</span>
            <span class="info-label">Intersection size:</span>
            <span class="info-value match">${result.intersectionSize}</span>
            <span class="info-label">Correct (verified):</span>
            <span class="info-value ${check.matches ? 'match' : 'private'}">${check.matches ? '✓' : '✗'}</span>
          </div>
          <div style="margin-top:0.75rem">
            ${result.intersection.length > 0
              ? result.intersection.map((el) => `<div class="intersection-item">${esc(el)}</div>`).join('')
              : '<div class="status info">∅ Empty intersection — no common elements.</div>'}
          </div>
        </div>
        <div class="card" style="margin-top:0.75rem">
          <div style="margin-bottom:0.5rem;font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">What each party learned</div>
          <div class="info-grid">
            <span class="info-label">Alice learned:</span>
            <span class="info-value match">The intersection (${result.intersectionSize} elements) + Bob's set size (${result.aliceLearnedBobSize})</span>
            <span class="info-label">Bob learned:</span>
            <span class="info-value bob">Alice's set size (${result.bobLearnedAliceSize})</span>
            <span class="info-label">Neither learned:</span>
            <span class="info-value">Alice's ${aliceSet.length - result.intersectionSize} non-matching elements; Bob's ${bobSet.length - result.intersectionSize} non-matching elements</span>
          </div>
        </div>`;

      runBtn.disabled = false;
      runBtn.textContent = 'Run PSI';
    }, 50);
  });
}

// Note (Exhibit 3 protocol picker): the radio inputs live in the HTML
// template below; the handler above reads them at click time.

// ---------------------------------------------------------------------------
// Exhibit 4 — Attack Demos
// ---------------------------------------------------------------------------

function initExhibit4(): void {
  // --- Attack 1: Set Size Inflation ---
  const a1Btn = document.getElementById('e4-a1-run') as HTMLButtonElement;
  const a1Output = document.getElementById('e4-a1-output') as HTMLDivElement;

  a1Btn.addEventListener('click', () => {
    const aliceSet = ['alice@example.com', 'mom@example.com', 'pastor@church.org'];
    const bobReal = ['alice@example.com', 'real.user@example.com'];
    // Bob inflates with junk entries
    const junk = Array.from({ length: 20 }, (_, i) => `fake.user.${i}@attacker.com`);
    const bobInflated = [...bobReal, ...junk];

    const result = simulateSetSizeInflation(aliceSet, bobReal, bobInflated);
    a1Output.innerHTML = `
      <div class="result-box">
        <div class="info-grid">
          <span class="info-label">Alice sees Bob's set size as:</span>
          <span class="info-value warning">${result.aliceSeesBobSize} (inflated)</span>
          <span class="info-label">Bob's actual set size:</span>
          <span class="info-value bob">${result.actualBobSize}</span>
          <span class="info-label">Inflation delta:</span>
          <span class="info-value warning">+${result.inflationDelta} fake entries</span>
          <span class="info-label">Intersection (still correct):</span>
          <span class="info-value match">${result.intersection.join(', ') || '∅'}</span>
        </div>
        <div class="warning-box">
          Bob can claim any size without Alice knowing. Set size hiding requires
          padding, polynomial commitment, or size-preserving protocols (PaXoS, CM20).
        </div>
      </div>`;
  });

  // --- Attack 2: Dictionary Attack ---
  const a2Btn = document.getElementById('e4-a2-run') as HTMLButtonElement;
  const a2Output = document.getElementById('e4-a2-output') as HTMLDivElement;

  a2Btn.addEventListener('click', () => {
    // Alice's set is from a small domain — 4-digit PINs (Alice uses only 3)
    const aliceSet = ['1234', '5678', '9999'];
    // Bob enumerates 0000–0099 + some guesses
    const dictionary = Array.from({ length: 100 }, (_, i) =>
      i.toString().padStart(4, '0')
    ).concat(['1234', '5678', '9999', '0000', '1111']);

    const result = simulateDictionaryAttack(aliceSet, dictionary);
    a2Output.innerHTML = `
      <div class="result-box">
        <div class="info-grid">
          <span class="info-label">Alice's set size:</span>
          <span class="info-value alice">${aliceSet.length}</span>
          <span class="info-label">Bob's dictionary size:</span>
          <span class="info-value bob">${dictionary.length}</span>
          <span class="info-label">Alice's elements learned by Bob:</span>
          <span class="info-value private">${result.aliceElementsLearned.join(', ') || '∅'}</span>
          <span class="info-label">Coverage:</span>
          <span class="info-value warning">${result.coveragePercent}%</span>
        </div>
        <div class="warning-box">${esc(result.warningMessage)}</div>
      </div>`;
  });

  // --- Attack 3: Scalar Reuse ---
  const a3Btn = document.getElementById('e4-a3-run') as HTMLButtonElement;
  const a3Output = document.getElementById('e4-a3-output') as HTMLDivElement;

  a3Btn.addEventListener('click', () => {
    const session1 = ['alice@example.com', 'mom@example.com', 'bob@example.com'];
    const session2 = ['alice@example.com', 'mom@example.com', 'new.friend@example.com']; // bob removed, new.friend added
    const bobSet = ['alice@example.com', 'service.user@example.com'];
    const reusedAlpha = randomScalar();

    const result = simulateReplayAttack(session1, session2, bobSet, reusedAlpha);
    a3Output.innerHTML = `
      <div class="result-box">
        <div class="info-grid">
          <span class="info-label">Session 1 set:</span>
          <span class="info-value alice">${session1.join(', ')}</span>
          <span class="info-label">Session 2 set:</span>
          <span class="info-value alice">${session2.join(', ')}</span>
          <span class="info-label">Session 1 intersection:</span>
          <span class="info-value match">${result.session1Intersection.join(', ') || '∅'}</span>
          <span class="info-label">Session 2 intersection:</span>
          <span class="info-value match">${result.session2Intersection.join(', ') || '∅'}</span>
          <span class="info-label">Stable elements (both sessions):</span>
          <span class="info-value">${result.stableElements}</span>
          <span class="info-label">Elements added in session 2:</span>
          <span class="info-value warning">${result.addedElements}</span>
          <span class="info-label">Elements removed in session 2:</span>
          <span class="info-value warning">${result.removedElements}</span>
          <span class="info-label">Bob infers Alice's set changed:</span>
          <span class="info-value ${result.bobInfersAliceChange ? 'private' : 'match'}">${result.bobInfersAliceChange ? '✗ YES — privacy violation' : '✓ No change detected'}</span>
          <span class="info-label">Byte-identical Y_i seen in both sessions:</span>
          <span class="info-value private">${result.linkedYCount} of ${session1.length} (Bob links these with zero plaintext)</span>
          ${result.linkedYSamples.length > 0
            ? `<span class="info-label">Sample linked Y_i (Bob sees twice):</span>
               <span class="info-value">${result.linkedYSamples.map((s) => esc(s)).join(', ')}</span>`
            : ''}
        </div>
        <div class="warning-box">${esc(result.warningMessage)}</div>
      </div>`;
  });

  // --- Attack 4: Malformed / Low-Order Point Injection ---
  const a4Btn = document.getElementById('e4-a4-run') as HTMLButtonElement;
  const a4Output = document.getElementById('e4-a4-output') as HTMLDivElement;

  a4Btn.addEventListener('click', () => {
    const { probes, ristrettoVerdict } = simulateMalformedPointInjection();
    a4Output.innerHTML = `
      <div class="result-box">
        <table class="probe-table" aria-label="Malicious point injection probes">
          <thead>
            <tr>
              <th scope="col">Injected encoding</th>
              <th scope="col">32 bytes (hex)</th>
              <th scope="col">Decoded?</th>
            </tr>
          </thead>
          <tbody>
            ${probes
              .map(
                (p) => `
              <tr>
                <td>${esc(p.label)}</td>
                <td class="mono-cell">${esc(p.bytesHex.slice(0, 16))}…${esc(p.bytesHex.slice(-4))}</td>
                <td class="info-value ${p.accepted ? 'private' : 'match'}">${p.accepted ? '✗ accepted' : '✓ rejected'}</td>
              </tr>
              <tr class="probe-detail">
                <td colspan="3">${esc(p.consequence)}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
        <div class="warning-box">${esc(ristrettoVerdict)}</div>
      </div>`;
  });
}

// ---------------------------------------------------------------------------
// Exhibit 5 — Real-World Deployments
// ---------------------------------------------------------------------------

function initExhibit5(): void {
  // Gate test: run a quick PSI self-check and display results
  const selfTest = document.getElementById('e5-selftest') as HTMLDivElement;

  setTimeout(() => {
    try {
      // Test: hash-to-curve distinct inputs
      const h1 = pointToHex(hashToPoint('alice@example.com'));
      const h2 = pointToHex(hashToPoint('bob@example.com'));
      const hashDistinct = h1 !== h2;

      // Test: intersection correctness
      const r = runPSI(
        ['a@example.com', 'b@example.com', 'c@example.com'],
        ['b@example.com', 'c@example.com', 'd@example.com']
      );
      const intersectionOk = r.intersection.length === 2 &&
        r.intersection.includes('b@example.com') &&
        r.intersection.includes('c@example.com');

      // Test: empty intersection
      const rEmpty = runPSI(['x@example.com'], ['y@example.com']);
      const emptyOk = rEmpty.intersection.length === 0;

      // Test: identical sets
      const items = ['a@example.com', 'b@example.com', 'c@example.com'];
      const rFull = runPSI(items, items);
      const fullOk = rFull.intersection.length === 3;

      const tests = [
        { name: 'hashToPoint distinct inputs', ok: hashDistinct },
        { name: 'PSI small sets (3×3, 2 matching)', ok: intersectionOk },
        { name: 'PSI empty intersection', ok: emptyOk },
        { name: 'PSI identical sets', ok: fullOk },
      ];

      selfTest.innerHTML = `
        <div class="card">
          <div style="margin-bottom:0.5rem;font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">Gate Tests</div>
          ${tests
            .map(
              (t) =>
                `<div class="status ${t.ok ? 'ok' : 'error'}">${t.ok ? '✓' : '✗'} ${esc(t.name)}</div>`
            )
            .join('')}
        </div>`;
    } catch (err) {
      selfTest.innerHTML = `<div class="status error">Self-test error: ${esc(String(err))}</div>`;
    }
  }, 100);
}

// ---------------------------------------------------------------------------
// Exhibit 6 — Cryptographer's Lab (test vectors, benchmarks, transcript)
// ---------------------------------------------------------------------------

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(2)} KB`;
}

function initExhibit6(): void {
  // --- Test Vectors -------------------------------------------------------
  const tvBtn = document.getElementById('e6-tv-run') as HTMLButtonElement;
  const tvOutput = document.getElementById('e6-tv-output') as HTMLDivElement;
  const transcriptOutput = document.getElementById('e6-transcript') as HTMLDivElement;

  // Canonical inputs for the published test vector. Anyone reimplementing
  // DH-PSI on ristretto255 should reproduce these byte-for-byte.
  const TV_ALICE = ['alice@example.com', 'bob@example.com', 'mom@example.com'];
  const TV_BOB = ['bob@example.com', 'mom@example.com', 'eve@example.com'];
  const TV_ALPHA_SEED =
    '0000000000000000000000000000000000000000000000000000000000000007';
  const TV_BETA_SEED =
    '000000000000000000000000000000000000000000000000000000000000000b';

  function renderTestVectors(): void {
    const alpha = scalarFromSeed(TV_ALPHA_SEED);
    const beta = scalarFromSeed(TV_BETA_SEED);
    const trace = tracePSI(TV_ALICE, TV_BOB, alpha, beta);

    const row = (label: string, hex: string): string => `
      <div class="tv-row">
        <span class="tv-label">${esc(label)}</span>
        <code class="tv-hex">${esc(hex)}</code>
      </div>`;

    const hashRows = trace.aliceSet
      .map((el, i) => row(`H(a${i + 1}) — "${el}"`, pointToHex(trace.hashedAlice[i])))
      .join('') +
      trace.bobSet
        .map((el, i) => row(`H(b${i + 1}) — "${el}"`, pointToHex(trace.hashedBob[i])))
        .join('');

    const wireRows =
      trace.wireA2B_X
        .map((p, i) => row(`X_${i + 1} = α·H(a${i + 1})`, pointToHex(p)))
        .join('') +
      trace.wireB2A_Y
        .map((p, i) => row(`Y_${i + 1} = β·X_${i + 1}`, pointToHex(p)))
        .join('') +
      trace.wireB2A_Z
        .map((p, j) => row(`Z_${j + 1} = β·H(b${j + 1})`, pointToHex(p)))
        .join('') +
      trace.computedW
        .map((p, j) => row(`W_${j + 1} = α·Z_${j + 1}`, pointToHex(p)))
        .join('');

    tvOutput.innerHTML = `
      <div class="card">
        <div class="card-section-label">Inputs (fixed)</div>
        ${row('Group', 'ristretto255 (prime order, RFC 9496 + RFC 9380 hash-to-curve)')}
        ${row('α seed', TV_ALPHA_SEED)}
        ${row('β seed', TV_BETA_SEED)}
        ${row('α (32 bytes, big-endian)', pointToHex(trace.aliceScalar))}
        ${row('β (32 bytes, big-endian)', pointToHex(trace.bobScalar))}
        ${row('A = {a_i}', TV_ALICE.join(', '))}
        ${row('B = {b_j}', TV_BOB.join(', '))}
      </div>
      <div class="card">
        <div class="card-section-label">Hashed inputs (not on wire)</div>
        ${hashRows}
      </div>
      <div class="card">
        <div class="card-section-label">Protocol points</div>
        ${wireRows}
      </div>
      <div class="status ok">
        Expected intersection: {${trace.intersection.join(', ')}} —
        any conforming DH-PSI/ristretto255 implementation MUST produce
        the same X, Y, Z, W byte strings given these inputs.
      </div>`;

    // --- Transcript view (uses same trace) --------------------------------
    const dump = (bytes: Uint8Array): string =>
      Array.from(bytes)
        .map((b, i) => {
          const sep = i > 0 && i % 8 === 0 ? ' ' : '';
          return sep + b.toString(16).padStart(2, '0');
        })
        .join('');

    const xBytes = trace.wireA2B_X.length * 32;
    const yBytes = trace.wireB2A_Y.length * 32;
    const zBytes = trace.wireB2A_Z.length * 32;

    transcriptOutput.innerHTML = `
      <div class="card">
        <div class="card-section-label">A → B  Round 1 — ${trace.wireA2B_X.length} × 32 B = ${formatBytes(xBytes)}</div>
        ${trace.wireA2B_X.map((p, i) => `
          <div class="wire-line wire-alice">
            <span class="wire-tag">X_${i + 1}</span>
            <code class="wire-hex">${dump(p)}</code>
          </div>`).join('')}
      </div>
      <div class="card">
        <div class="card-section-label">B → A  Round 2 — ${trace.wireB2A_Y.length + trace.wireB2A_Z.length} × 32 B = ${formatBytes(yBytes + zBytes)}</div>
        ${trace.wireB2A_Y.map((p, i) => `
          <div class="wire-line wire-doubleblinded">
            <span class="wire-tag">Y_${i + 1}</span>
            <code class="wire-hex">${dump(p)}</code>
          </div>`).join('')}
        ${trace.wireB2A_Z.map((p, j) => `
          <div class="wire-line wire-bob">
            <span class="wire-tag">Z_${j + 1}</span>
            <code class="wire-hex">${dump(p)}</code>
          </div>`).join('')}
      </div>
      <div class="status info">
        Total wire traffic: ${formatBytes(xBytes + yBytes + zBytes)}
        (${trace.wireA2B_X.length + trace.wireB2A_Y.length + trace.wireB2A_Z.length} ristretto points).
        DH-PSI is O(n+m) points sent — linear in set sizes.
      </div>`;
  }

  tvBtn.addEventListener('click', renderTestVectors);
  // Render the canonical vectors immediately so reviewers see them on load.
  renderTestVectors();

  // --- Benchmarks ---------------------------------------------------------
  const bmBtn = document.getElementById('e6-bm-run') as HTMLButtonElement;
  const bmOutput = document.getElementById('e6-bm-output') as HTMLDivElement;

  type BenchRow = { name: string; iter: number; totalMs: number; perOpUs: number; opsPerSec: number };

  function localBench(name: string, iter: number, fn: () => void): BenchRow {
    const warm = Math.min(50, Math.max(1, Math.floor(iter * 0.05)));
    for (let i = 0; i < warm; i++) fn();
    const t0 = performance.now();
    for (let i = 0; i < iter; i++) fn();
    const totalMs = performance.now() - t0;
    return { name, iter, totalMs, perOpUs: (totalMs * 1000) / iter, opsPerSec: iter / (totalMs / 1000) };
  }

  bmBtn.addEventListener('click', async () => {
    bmBtn.disabled = true;
    bmBtn.innerHTML =
      '<span class="spinner" aria-hidden="true"></span><span class="sr-only">Running benchmarks…</span> Running…';
    bmOutput.innerHTML =
      '<div class="status info" role="status">Running benchmarks in a Web Worker — UI stays responsive…</div>';

    const fmt = (n: number, d = 2): string => {
      if (n >= 1000) return Math.round(n).toLocaleString();
      return n.toFixed(d);
    };

    // Set-size grid — now goes up to 1k × 1k because the worker keeps the
    // main thread free. (10k × 10k is feasible but ~30s; we keep it sane.)
    const sizes: Array<[number, number]> = [
      [10, 10], [100, 100], [500, 500], [1000, 1000],
    ];

    let microBenches: BenchRow[];
    let psiRows: BenchRow[];

    try {
      if (workerSupported()) {
        const microTasks = (['hashToPoint', 'scalarMul', 'randomScalar'] as const).map(
          async (op) => {
            const r = await callWorker<{ totalMs: number; perOpUs: number; opsPerSec: number; iter: number }>(
              'bench-op',
              { op, iter: op === 'randomScalar' ? 1000 : 500 }
            );
            return { name: op, ...r };
          }
        );
        microBenches = await Promise.all(microTasks);

        psiRows = [];
        for (const [n, m] of sizes) {
          // Smaller iter for bigger sets so the wall-time stays bounded.
          const iter = n >= 500 ? 2 : n >= 100 ? 4 : 6;
          const r = await callWorker<{ totalMs: number; perOpUs: number; opsPerSec: number; iter: number }>(
            'bench-psi',
            { n, m, iter }
          );
          psiRows.push({ name: `PSI ${n} × ${m}`, ...r });
        }
      } else {
        // Fallback for environments without Worker support — keep the
        // smaller grid so the page doesn't lock up.
        microBenches = [
          localBench('hashToPoint', 500, () => { hashToPoint('bench-' + Math.random()); }),
          localBench('scalarMul', 500, () => {
            const p = hashToPoint('benchmark');
            const s = randomScalar();
            scalarMul(s, p);
          }),
          localBench('randomScalar', 1000, () => { randomScalar(); }),
        ];
        psiRows = [];
        for (const [n, m] of [[10, 10], [100, 100]] as Array<[number, number]>) {
          const a = Array.from({ length: n }, (_, i) => `alice-${i}@example.com`);
          const b = Array.from({ length: m }, (_, j) => `bob-${j}@example.com`);
          a[0] = b[0]; if (a.length > 1 && b.length > 1) a[1] = b[1];
          psiRows.push(localBench(`PSI ${n} × ${m}`, n >= 100 ? 4 : 6, () => { runPSI(a, b); }));
        }
      }
    } catch (err) {
      bmOutput.innerHTML = `<div class="status error">Benchmark error: ${esc(String(err))}</div>`;
      bmBtn.disabled = false;
      bmBtn.textContent = 'Run benchmarks again';
      return;
    }

    const rowsHtml = (rows: BenchRow[]): string =>
      rows
        .map(
          (r) => `
            <tr>
              <td>${esc(r.name)}</td>
              <td class="num">${r.iter}</td>
              <td class="num">${fmt(r.totalMs)} ms</td>
              <td class="num">${fmt(r.perOpUs)} µs</td>
              <td class="num">${fmt(r.opsPerSec, 0)} /s</td>
            </tr>`
        )
        .join('');

    bmOutput.innerHTML = `
      <div class="result-box">
        <table class="bench-table" aria-label="Benchmark results">
          <thead>
            <tr>
              <th scope="col">Operation</th>
              <th scope="col" class="num">Iterations</th>
              <th scope="col" class="num">Total</th>
              <th scope="col" class="num">Per op</th>
              <th scope="col" class="num">Throughput</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml(microBenches)}
            <tr><td colspan="5" class="bench-section">End-to-end DH-PSI (in worker)</td></tr>
            ${rowsHtml(psiRows)}
          </tbody>
        </table>
        <div class="status info">
          Numbers are from THIS browser session, executed in a Web Worker so the
          main thread stays responsive. For reference: KKRT16/VOLE-PSI in C++ reach
          ~10⁶ elements/sec/core. DH-PSI in JS is roughly two orders of magnitude
          slower and exists here for clarity, not throughput.
        </div>
      </div>`;

    bmBtn.disabled = false;
    bmBtn.textContent = 'Run benchmarks again';
  });

  // --- DDH-pseudorandomness visualization -------------------------------
  initDDHVisualization();
}

function initDDHVisualization(): void {
  const btn = document.getElementById('e6-ddh-run') as HTMLButtonElement | null;
  const out = document.getElementById('e6-ddh-output') as HTMLDivElement | null;
  if (!btn || !out) return;

  // Critical chi-square values for df=255 (two-sided, common α levels).
  // Source: standard tables. If observed χ² falls outside [lower, upper],
  // reject the null hypothesis of uniformity at that significance level.
  const CRIT = {
    p01_lo: 198.380,
    p01_hi: 317.097,
    p05_lo: 213.997,
    p05_hi: 297.829,
  };

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const originalLabel = btn.textContent ?? '';
    btn.innerHTML =
      '<span class="spinner" aria-hidden="true"></span><span class="sr-only">Sampling…</span> Sampling…';
    out.innerHTML =
      '<div class="status info" role="status">Hashing 5000 strings, multiplying by α in a worker, binning bytes 0–255…</div>';

    try {
      const res = await callWorker<{
        histogram: number[];
        totalBytes: number;
        chiSq: number;
        df: number;
        sampleAlphaHex: string;
        count: number;
      }>('distribution', { count: 5000 });

      // Render histogram as inline SVG bars. Width fixed at 512 (2px/bin).
      const w = 512;
      const h = 160;
      const max = Math.max(...res.histogram);
      const expected = res.totalBytes / 256;
      const barW = w / 256;
      const bars = res.histogram
        .map((v, i) => {
          const bh = (v / max) * (h - 24);
          const y = h - bh - 16;
          return `<rect x="${i * barW}" y="${y}" width="${barW - 0.2}" height="${bh}" fill="var(--alice)" opacity="0.7"></rect>`;
        })
        .join('');

      const expectedY = h - (expected / max) * (h - 24) - 16;

      const verdict =
        res.chiSq >= CRIT.p01_lo && res.chiSq <= CRIT.p01_hi
          ? { msg: 'Distribution is consistent with uniform (cannot reject H₀ at α = 0.01).', cls: 'ok' }
          : res.chiSq >= CRIT.p05_lo && res.chiSq <= CRIT.p05_hi
          ? { msg: 'Distribution is consistent with uniform (cannot reject H₀ at α = 0.05).', cls: 'ok' }
          : { msg: 'Distribution differs from uniform at α = 0.05 (unusual — re-run to check).', cls: 'warn' };

      out.innerHTML = `
        <div class="card">
          <div class="card-section-label">Byte-frequency histogram of α·H(x) for ${res.count.toLocaleString()} fresh x</div>
          <div class="ddh-chart-wrap">
            <svg class="ddh-chart" viewBox="0 0 ${w} ${h}" role="img"
              aria-label="Histogram of byte values 0 to 255 from ${res.totalBytes.toLocaleString()} ristretto255 output bytes; bars near horizontal line indicate uniform distribution.">
              <line x1="0" y1="${expectedY}" x2="${w}" y2="${expectedY}"
                stroke="var(--match)" stroke-dasharray="4 3" stroke-width="1.5"></line>
              ${bars}
              <text x="${w - 4}" y="${expectedY - 4}" text-anchor="end"
                fill="var(--match)" font-family="var(--mono)" font-size="10">
                expected ≈ ${Math.round(expected).toLocaleString()}
              </text>
            </svg>
          </div>
          <div class="info-grid">
            <span class="info-label">Samples (32 bytes each):</span>
            <span class="info-value">${res.count.toLocaleString()} ⇒ ${res.totalBytes.toLocaleString()} byte observations</span>
            <span class="info-label">α (fresh, this run):</span>
            <span class="info-value mono-cell">${esc(res.sampleAlphaHex)}</span>
            <span class="info-label">Chi-square statistic (df = 255):</span>
            <span class="info-value">${res.chiSq.toFixed(2)}</span>
            <span class="info-label">α = 0.05 acceptance range:</span>
            <span class="info-value">${CRIT.p05_lo.toFixed(2)} … ${CRIT.p05_hi.toFixed(2)}</span>
            <span class="info-label">α = 0.01 acceptance range:</span>
            <span class="info-value">${CRIT.p01_lo.toFixed(2)} … ${CRIT.p01_hi.toFixed(2)}</span>
          </div>
          <div class="status ${verdict.cls}">${esc(verdict.msg)}</div>
          <div class="status info">
            This is the operational consequence of DDH: for any x ∉ A ∩ B,
            the value α·H(x) that an honest-but-curious Bob receives is
            computationally indistinguishable from a uniform ristretto point —
            so its byte-wise marginals are flat to within sampling noise.
          </div>
        </div>`;
    } catch (err) {
      out.innerHTML = `<div class="status error">Visualization error: ${esc(String(err))}</div>`;
    }

    btn.disabled = false;
    btn.textContent = originalLabel || 'Resample distribution';
  });
}

// ---------------------------------------------------------------------------
// HTML template
// ---------------------------------------------------------------------------

const appEl = document.getElementById('app')!;
appEl.innerHTML = `
<a href="#main-content" class="skip-link">Skip to main content</a>
<header>
  <h1>PSI Gate</h1>
  <p>
    Private Set Intersection — compute A ∩ B without either party
    learning non-matching elements.
    <span class="security-note">Semi-honest secure only</span>
  </p>
  <p style="font-size:0.8rem;margin-top:0.25rem">
    DH-PSI (Meadows 1986, Huberman-Franklin-Hogg 1999) · ristretto255 · No backends
  </p>
</header>

<div role="tablist" aria-label="Demo exhibits">
  <button type="button" id="tab-1" role="tab" aria-selected="true"  aria-controls="exhibit-1" tabindex="0"  class="tab-btn active">1. Contact Discovery</button>
  <button type="button" id="tab-2" role="tab" aria-selected="false" aria-controls="exhibit-2" tabindex="-1" class="tab-btn">2. Protocol Walkthrough</button>
  <button type="button" id="tab-3" role="tab" aria-selected="false" aria-controls="exhibit-3" tabindex="-1" class="tab-btn">3. Live Simulator</button>
  <button type="button" id="tab-4" role="tab" aria-selected="false" aria-controls="exhibit-4" tabindex="-1" class="tab-btn">4. Attacks</button>
  <button type="button" id="tab-5" role="tab" aria-selected="false" aria-controls="exhibit-5" tabindex="-1" class="tab-btn">5. Real-World</button>
  <button type="button" id="tab-6" role="tab" aria-selected="false" aria-controls="exhibit-6" tabindex="-1" class="tab-btn">6. Cryptographer's Lab</button>
</div>

<main id="main-content">
<!-- ── Exhibit 1 ── -->
<section id="exhibit-1" role="tabpanel" aria-labelledby="tab-1" class="exhibit active">
  <h2>The Contact Discovery Problem</h2>
  <p>
    You just downloaded <strong>PrayerWarriors.Mobi</strong>. Which of your 8 trusted
    prayer partners are already on the app? The naive solution sends your entire address
    book to the server — a privacy violation. PSI solves this.
  </p>
  <div class="card-row">
    <div>
      <div class="set-label alice">Your Contacts (Alice)</div>
      <ul id="e1-alice-list" class="element-list" aria-label="Alice's contacts"></ul>
    </div>
    <div>
      <div class="set-label bob">App User Database (Bob / Server)</div>
      <ul id="e1-bob-list" class="element-list" aria-label="Server's user database"></ul>
    </div>
  </div>
  <div style="margin-top:1rem">
    <button id="e1-run" type="button" class="btn primary">Run Private Set Intersection</button>
  </div>
  <div id="e1-output" aria-live="polite" aria-atomic="true"></div>
  <div class="card" style="margin-top:1rem">
    <div class="info-grid">
      <span class="info-label">Naive approach:</span>
      <span class="info-value private">Send all 8 contacts to server → server learns your full address book</span>
      <span class="info-label">PSI approach:</span>
      <span class="info-value match">Cryptographically blind contacts → server learns only the intersection size</span>
    </div>
  </div>
</section>

<!-- ── Exhibit 2 ── -->
<section id="exhibit-2" role="tabpanel" aria-labelledby="tab-2" class="exhibit">
  <h2>DH-PSI Protocol — Step by Step</h2>
  <p>
    The classic three-round interactive protocol. Click through each round to see
    how blinding transforms plain emails into random curve points — and back.
  </p>
  <div id="e2-panel" class="step-panel" aria-live="polite" aria-atomic="true"></div>
  <div class="step-nav">
    <button type="button" id="e2-prev" class="btn">← Prev</button>
    <span id="e2-step" style="align-self:center;color:var(--text-muted);font-size:0.85rem" aria-live="polite"></span>
    <button id="e2-next" type="button" class="btn primary">Next →</button>
  </div>
</section>

<!-- ── Exhibit 3 ── -->
<section id="exhibit-3" role="tabpanel" aria-labelledby="tab-3" class="exhibit">
  <h2>Live Contact Matching Simulator</h2>
  <p>Enter your own sets — one element per line. PSI runs entirely in your browser.</p>
  <div class="card-row">
    <div>
      <label for="e3-alice" class="set-label alice">Alice's Set (your contacts)</label>
      <textarea id="e3-alice" placeholder="Enter one element per line…"></textarea>
    </div>
    <div>
      <label for="e3-bob" class="set-label bob">Bob's Set (server user database)</label>
      <textarea id="e3-bob" placeholder="Enter one element per line…"></textarea>
    </div>
  </div>
  <fieldset class="proto-picker">
    <legend>Protocol</legend>
    <label class="proto-option">
      <input type="radio" name="e3-proto" value="dh" checked>
      <span>DH-PSI (Meadows 1986)</span>
      <small>three-round interactive; both parties exchange points</small>
    </label>
    <label class="proto-option">
      <input type="radio" name="e3-proto" value="oprf">
      <span>OPRF-PSI (Jarecki-Liu 2010)</span>
      <small>Bob publishes PRF tags once; Signal-style contact discovery</small>
    </label>
  </fieldset>
  <div style="margin-top:0.75rem">
    <button id="e3-run" type="button" class="btn primary">Run PSI</button>
  </div>
  <div id="e3-output" aria-live="polite" aria-atomic="true"></div>
</section>

<!-- ── Exhibit 4 ── -->
<section id="exhibit-4" role="tabpanel" aria-labelledby="tab-4" class="exhibit">
  <h2>What Can Go Wrong — Attack Simulations</h2>

  <div class="card">
    <h3>Attack 1 — Set Size Inflation</h3>
    <p>
      Bob can claim any set size without Alice knowing. He can inflate to
      hide his database size, or deflate to look smaller.
    </p>
    <button id="e4-a1-run" type="button" class="btn danger">Simulate Inflation</button>
    <div id="e4-a1-output" aria-live="polite" aria-atomic="true"></div>
  </div>

  <div class="card">
    <h3>Attack 2 — Dictionary Attack on Small Domains</h3>
    <p>
      If Alice's elements come from a small domain (4-digit PINs, short codes),
      Bob can enumerate the entire domain as his set and learn Alice's full set.
    </p>
    <button id="e4-a2-run" type="button" class="btn danger">Simulate Dictionary Attack</button>
    <div id="e4-a2-output" aria-live="polite" aria-atomic="true"></div>
  </div>

  <div class="card">
    <h3>Attack 3 — Scalar Reuse Across Sessions</h3>
    <p>
      If Alice reuses α across two PSI sessions, Bob can link the sessions and
      detect which elements changed — even without reading any element values.
    </p>
    <button id="e4-a3-run" type="button" class="btn danger">Simulate Scalar Reuse</button>
    <div id="e4-a3-output" aria-live="polite" aria-atomic="true"></div>
  </div>

  <div class="card">
    <h3>Attack 4 — Malformed / Low-Order Point Injection</h3>
    <p>
      Malicious Bob (or a network attacker) submits crafted 32-byte values
      instead of legitimate group points: the identity, low-order torsion
      points, non-canonical encodings, garbage. On raw Ed25519/Curve25519
      these enable real attacks; ristretto255 is designed to reject them.
    </p>
    <button id="e4-a4-run" type="button" class="btn danger">Probe Input Validation</button>
    <div id="e4-a4-output" aria-live="polite" aria-atomic="true"></div>
  </div>
</section>

<!-- ── Exhibit 5 ── -->
<section id="exhibit-5" role="tabpanel" aria-labelledby="tab-5" class="exhibit">
  <h2>Real-World PSI Deployments</h2>
  <div id="e5-selftest" aria-live="polite" aria-atomic="true"></div>

  <div class="deployment-grid" style="margin-top:1rem">
    <div class="deployment-card">
      <h4>Signal — Contact Discovery</h4>
      <p>SGX enclave + OPRF-based PSI. Processes millions of contacts per query
      without the server learning them. Open-source: signalapp/ContactDiscoveryService.</p>
    </div>
    <div class="deployment-card">
      <h4>Apple Password Monitoring (iOS 14+)</h4>
      <p>Checks saved passwords against breach databases using a PSI variant.
      Apple does not learn your passwords.</p>
    </div>
    <div class="deployment-card">
      <h4>Google Password Checkup</h4>
      <p>Checks passwords against 4+ billion leaked credentials.
      Uses blind hashing + k-anonymity. Google does not learn your passwords.</p>
    </div>
    <div class="deployment-card">
      <h4>Google Private Join and Compute</h4>
      <p>Ad conversion attribution across organizations. Two companies compute joint
      conversion statistics without seeing each other's user databases.
      Open-source: google/private-join-and-compute.</p>
    </div>
    <div class="deployment-card">
      <h4>DP3T / Google-Apple Exposure Notification</h4>
      <p>COVID-19 contact tracing via Bluetooth proximity. PSI with ephemeral IDs.
      Decentralized — no government server sees your contacts.</p>
    </div>
    <div class="deployment-card">
      <h4>Healthcare — Cross-Hospital Billing Detection</h4>
      <p>Hospitals combine patient record hashes to detect double-billing patterns.
      Individual records never leave their originating institution.</p>
    </div>
  </div>

  <div class="card" style="margin-top:1.5rem">
    <h3>The PrayerWarriors.Mobi Connection</h3>
    <p>
      When a user joins PrayerWarriors.Mobi, they can identify trusted prayer partners.
      The app needs to know which partners are also users — so prayers can be securely
      shared. PSI enables this without the server ever seeing your full contact list,
      and without you downloading the full user database.
    </p>
    <p>
      Your address book never reaches the server. The server's user database never
      reaches you. Only the intersection — prayer partners who are also on the app —
      becomes known. This is exactly the Signal model, adapted for prayer.
    </p>
  </div>

  <div class="card" style="margin-top:1rem">
    <h3>Related Crypto Labs</h3>
    <pre aria-label="Related crypto lab projects">crypto-lab-opaque-gate       — aPAKE (authentication, related primitive)
crypto-lab-silent-tally      — private aggregation
crypto-lab-blind-oracle      — TFHE (general-purpose PSI via FHE)
crypto-lab-oblivious-shelf   — PIR (private information retrieval)
crypto-lab-patron-shield     — privacy-preserving analytics
crypto-lab-paillier-gate     — Paillier (used in some PSI variants)
crypto-lab-ot-gate           — oblivious transfer (used in OPRF-PSI)</pre>
  </div>
</section>

<!-- ── Exhibit 6 — Cryptographer's Lab ── -->
<section id="exhibit-6" role="tabpanel" aria-labelledby="tab-6" class="exhibit">
  <h2>Cryptographer's Lab</h2>
  <p>
    Reproducible test vectors, wire-format transcripts, benchmarks, and the
    semi-honest security argument. Everything here is byte-exact and replayable.
  </p>

  <h3>Test Vectors (canonical)</h3>
  <p>
    Fixed inputs, fixed scalars (no shuffling, no fresh randomness). Any
    conforming DH-PSI on ristretto255 must reproduce every hex string below.
    NOTE: this mode disables shuffling and uses seeded scalars — it is a
    reference oracle, NOT a secure execution.
  </p>
  <button id="e6-tv-run" type="button" class="btn primary">Recompute Test Vectors</button>
  <div id="e6-tv-output" aria-live="polite" aria-atomic="true"></div>

  <h3>Wire-Format Transcript</h3>
  <p>
    Byte-by-byte view of every ristretto point sent over the wire during the
    test-vector run above. Color-coded by sender; recompute to refresh.
  </p>
  <div id="e6-transcript" aria-live="polite" aria-atomic="true"></div>

  <h3>Benchmarks</h3>
  <p>
    Live measurement of <code>hashToPoint</code>, <code>scalarMul</code>, and
    end-to-end DH-PSI at a few set sizes. Numbers come from your browser, not
    a publication — useful for sanity-checking JS-vs-native expectations.
  </p>
  <button id="e6-bm-run" type="button" class="btn primary">Run Benchmarks</button>
  <div id="e6-bm-output" aria-live="polite" aria-atomic="true"></div>

  <h3>DDH Pseudorandomness — Empirical Check</h3>
  <p>
    Under DDH on ristretto255, the blinded values α·H(x) are computationally
    indistinguishable from uniform random group elements. We sample 5000 fresh
    strings, multiply by a fresh α, then bin every output byte across 0–255
    and compute a chi-square statistic against the uniform expectation.
  </p>
  <button id="e6-ddh-run" type="button" class="btn primary">Sample 5000 × α·H(x)</button>
  <div id="e6-ddh-output" aria-live="polite" aria-atomic="true"></div>

  <h3>Semi-Honest Security Argument</h3>
  <p>
    DH-PSI is secure against semi-honest (honest-but-curious) adversaries
    under the Decisional Diffie-Hellman assumption on ristretto255.
    Each party's view is computationally indistinguishable from a simulated
    view constructed using only their input, output, and set sizes.
  </p>
  <div class="card-row">
    <div class="card">
      <div class="card-section-label">Simulator for corrupt Alice</div>
      <p>Given α (Alice's private input), A, and the output (intersection I, |B|):</p>
      <ol class="proof-list">
        <li>For each element of I, compute Y* = αβ'·H(x) using a fresh β'.</li>
        <li>For each remaining slot up to |A|, sample a uniform random ristretto point.</li>
        <li>Sample |B| fresh random points and assign to Z* (shuffled).</li>
        <li>Output (Y*, Z*) as the simulated round-2 message.</li>
      </ol>
      <p class="proof-note">
        Indistinguishable from a real run by DDH: αβ·H(x) for x ∉ A ∩ B
        is pseudorandom to Alice, who only knows α.
      </p>
    </div>
    <div class="card">
      <div class="card-section-label">Simulator for corrupt Bob</div>
      <p>Given β (Bob's private input), B, and the output (|A|):</p>
      <ol class="proof-list">
        <li>Sample |A| fresh uniform random ristretto points as X*.</li>
        <li>Compute Y* = β·X* (the simulator can do this since β is known).</li>
        <li>Output X* as the simulated round-1 message.</li>
      </ol>
      <p class="proof-note">
        Indistinguishable from a real run by DDH: α·H(a_i) for fresh α
        is pseudorandom over the group, regardless of a_i.
      </p>
    </div>
  </div>

  <h3>What This Implementation Is NOT</h3>
  <ul class="caveat-list">
    <li><strong>Not constant-time.</strong> JavaScript <code>BigInt</code> and array
      ops leak timing through engine internals (GC, JIT). Use a native constant-time
      library (libsodium, BoringSSL) in production.</li>
    <li><strong>Not malicious-secure.</strong> No ZK proofs of correct β-application,
      no commitment to set sizes, no DoS defenses. See VOLE-PSI for malicious security.</li>
    <li><strong>Not side-channel hardened.</strong> No defense against cache, branch,
      or power side channels.</li>
    <li><strong>Not formally verified.</strong> The simulator sketch above is a
      proof intuition, not a machine-checked proof. See Hazay-Lindell or
      Pinkas-Schneider-Zohner for full proofs.</li>
  </ul>

  <h3>PSI Protocol Comparison</h3>
  <div class="psi-compare-scroll">
    <table class="psi-compare" aria-label="PSI protocol comparison">
      <thead>
        <tr>
          <th scope="col">Protocol</th>
          <th scope="col">Year</th>
          <th scope="col">Communication</th>
          <th scope="col">Computation</th>
          <th scope="col">Security</th>
          <th scope="col">Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">DH-PSI <em>(this demo)</em></th>
          <td>1986</td>
          <td>O(n + m) group elts</td>
          <td>O(n + m) scalar muls</td>
          <td>Semi-honest, DDH</td>
          <td>Simple, slow; baseline for understanding PSI</td>
        </tr>
        <tr>
          <th scope="row">OPRF-PSI (JL10)</th>
          <td>2010</td>
          <td>O(n + m) group elts</td>
          <td>O(n + m) scalar muls</td>
          <td>Semi-honest, one-more-DH</td>
          <td>Signal contact discovery — DH-PSI hardened with an OPRF</td>
        </tr>
        <tr>
          <th scope="row">KKRT16</th>
          <td>2016</td>
          <td>O(n) ciphertexts</td>
          <td>O(n) symmetric ops</td>
          <td>Semi-honest</td>
          <td>OT-extension based; ~10⁶ elts/sec in C++</td>
        </tr>
        <tr>
          <th scope="row">CM20 / SpOT-Light</th>
          <td>2020</td>
          <td>O(n) bits asymptotic</td>
          <td>O(n)</td>
          <td>Semi-honest</td>
          <td>Communication-optimal for small intersection</td>
        </tr>
        <tr>
          <th scope="row">PaXoS / VOLE-PSI</th>
          <td>2021</td>
          <td>O(n)</td>
          <td>O(n) field ops</td>
          <td>Malicious</td>
          <td>State-of-the-art; basis for modern Signal-style deployments</td>
        </tr>
        <tr>
          <th scope="row">FHE-PSI (Chen-Laine-Rindal)</th>
          <td>2017</td>
          <td>O(n) ciphertexts</td>
          <td>Heavy (FHE)</td>
          <td>Semi-honest</td>
          <td>Asymmetric: useful when one party has tiny set, other has huge</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
</main>

<footer>
  <p>DH-PSI (Meadows 1986, Huberman-Franklin-Hogg 1999) · ristretto255 via @noble/curves</p>
  <p style="margin-top:0.25rem;font-style:italic;color:var(--text-muted)">
    "Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God." — 1 Cor 10:31
  </p>
</footer>
`;

// Initialize all exhibits
initThemeToggle();
initTabs();
initExhibit1();
initExhibit2();
initExhibit3();
initExhibit4();
initExhibit5();
initExhibit6();

// Scalar-btn: reveal on click via event delegation.
// Keyboard activation (Space/Enter) on a <button> fires a click event, so no
// separate keydown handler is needed. Toggling aria-pressed flips both the
// visual reveal (CSS [aria-pressed="true"]) and the screen-reader exposure
// (inner [data-hex] is aria-hidden until revealed).
document.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const btn = target.closest<HTMLButtonElement>('.scalar-btn');
  if (!btn) return;
  const wasPressed = btn.getAttribute('aria-pressed') === 'true';
  const nowPressed = !wasPressed;
  btn.setAttribute('aria-pressed', nowPressed ? 'true' : 'false');
  const hex = btn.querySelector<HTMLElement>('[data-hex]');
  if (hex) hex.setAttribute('aria-hidden', nowPressed ? 'false' : 'true');
  // Which scalar this button is for — read out of the current label.
  const greek = /α/.test(btn.getAttribute('aria-label') ?? '') ? 'α' : 'β';
  btn.setAttribute(
    'aria-label',
    nowPressed
      ? `Hide private scalar ${greek} (currently revealed — click to toggle)`
      : `Reveal private scalar ${greek} (currently hidden — click to toggle)`
  );
});
