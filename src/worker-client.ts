/**
 * Thin promise-based client around src/psi-worker.ts.
 *
 * Manages a single long-lived worker, multiplexes requests by id, applies a
 * per-call timeout, supports AbortSignal cancellation, and recycles the
 * worker on hard errors so a single bad request can't deadlock the UI.
 */

type WorkerResponse =
  | { id: number; ok: true; result: unknown }
  | { id: number; ok: false; error: string };

interface PendingSlot {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout> | null;
  abortListener: (() => void) | null;
  signal: AbortSignal | null;
}

const DEFAULT_TIMEOUT_MS = 30_000;

let workerInstance: Worker | null = null;
let nextId = 1;
const pending = new Map<number, PendingSlot>();

function clearSlot(slot: PendingSlot): void {
  if (slot.timer !== null) clearTimeout(slot.timer);
  if (slot.signal && slot.abortListener) {
    slot.signal.removeEventListener('abort', slot.abortListener);
  }
}

function failAllPending(err: Error): void {
  for (const slot of pending.values()) {
    clearSlot(slot);
    slot.reject(err);
  }
  pending.clear();
}

function recycleWorker(reason: Error): void {
  if (workerInstance) {
    try { workerInstance.terminate(); } catch { /* ignore */ }
    workerInstance = null;
  }
  failAllPending(reason);
}

function getWorker(): Worker {
  if (workerInstance) return workerInstance;
  workerInstance = new Worker(new URL('./psi-worker.ts', import.meta.url), {
    type: 'module',
  });
  workerInstance.addEventListener('message', (e: MessageEvent<WorkerResponse>) => {
    const { id } = e.data;
    if (id === 0) return; // readiness ping
    const slot = pending.get(id);
    if (!slot) return;
    pending.delete(id);
    clearSlot(slot);
    if (e.data.ok) slot.resolve(e.data.result);
    else slot.reject(new Error(e.data.error));
  });
  workerInstance.addEventListener('error', (e) => {
    // Worker is now in an unknown state — recycle so the next call gets
    // a fresh instance rather than queueing behind a dead one.
    recycleWorker(new Error(e.message || 'worker error'));
  });
  workerInstance.addEventListener('messageerror', () => {
    recycleWorker(new Error('worker structured-clone error'));
  });
  return workerInstance;
}

export interface CallWorkerOptions {
  /** Per-call timeout in milliseconds. Default 30s. Pass 0 to disable. */
  timeoutMs?: number;
  /** Optional AbortSignal — rejecting the promise on abort. */
  signal?: AbortSignal;
}

export function callWorker<T = unknown>(
  kind: string,
  payload: unknown,
  options: CallWorkerOptions = {}
): Promise<T> {
  const id = nextId++;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const signal = options.signal ?? null;

  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const slot: PendingSlot = {
      resolve: resolve as (v: unknown) => void,
      reject,
      timer: null,
      abortListener: null,
      signal,
    };

    if (timeoutMs > 0) {
      slot.timer = setTimeout(() => {
        if (!pending.delete(id)) return;
        // Timeout means the worker is wedged or doing the wrong thing — recycle
        // so subsequent calls get a clean instance.
        recycleWorker(new Error(`worker call '${kind}' timed out after ${timeoutMs}ms`));
        reject(new Error(`worker call '${kind}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }

    if (signal) {
      slot.abortListener = (): void => {
        if (!pending.delete(id)) return;
        clearSlot(slot);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      signal.addEventListener('abort', slot.abortListener, { once: true });
    }

    pending.set(id, slot);
    try {
      getWorker().postMessage({ id, kind, payload });
    } catch (err) {
      pending.delete(id);
      clearSlot(slot);
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/** Convenience: check whether Web Workers are available in this environment. */
export function workerSupported(): boolean {
  return typeof Worker !== 'undefined';
}
