export async function runNonCriticalEffect(
  context: string,
  effect: () => Promise<void>,
) {
  try {
    await effect();
  } catch (error) {
    console.error(`[non-critical] ${context}`, error);
  }
}

export async function settleNonCriticalEffects(
  context: string,
  effects: Array<Promise<unknown>>,
) {
  const results = await Promise.allSettled(effects);
  const rejectedResults = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  if (rejectedResults.length === 0) {
    return;
  }

  console.error(
    `[non-critical] ${context}: ${rejectedResults.length} effect(s) failed`,
    rejectedResults.map((result) => result.reason),
  );
}
