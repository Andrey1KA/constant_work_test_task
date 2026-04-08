const inFlight = new Map<string, Promise<unknown>>();

export function runLlmDeduped<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const p = run().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, p);
  return p;
}

export function resetLlmInFlightForTests(): void {
  inFlight.clear();
}
