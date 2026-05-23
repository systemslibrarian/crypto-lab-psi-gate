/**
 * Thin promise-based client around src/psi-worker.ts.
 * Manages a single long-lived worker, multiplexes requests by id.
 */

type WorkerResponse =
  | { id: number; ok: true; result: unknown }
  | { id: number; ok: false; error: string };

let workerInstance: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

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
    if (e.data.ok) slot.resolve(e.data.result);
    else slot.reject(new Error(e.data.error));
  });
  workerInstance.addEventListener('error', (e) => {
    // Reject every in-flight request — the worker is now in an unknown state.
    for (const { reject } of pending.values()) reject(new Error(e.message || 'worker error'));
    pending.clear();
  });
  return workerInstance;
}

export function callWorker<T = unknown>(kind: string, payload: unknown): Promise<T> {
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    getWorker().postMessage({ id, kind, payload });
  });
}

/** Convenience: check whether Web Workers are available in this environment. */
export function workerSupported(): boolean {
  return typeof Worker !== 'undefined';
}
