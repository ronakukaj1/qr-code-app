const RETRYABLE = /fetch failed|ETIMEDOUT|ECONNRESET|ENOTFOUND|EAI_AGAIN|socket hang up/i;

/**
 * @template T
 * @param {() => Promise<T>} operation
 * @param {{ retries?: number; delayMs?: number; label?: string }} [options]
 * @returns {Promise<T>}
 */
export async function withGraphqlRetry(
  operation,
  { retries = 3, delayMs = 400, label = "GraphQL request" } = {},
) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable = RETRYABLE.test(message);

      console.error(
        `[graphql-retry] ${label} failed (attempt ${attempt}/${retries}): ${message}`,
      );

      if (!retryable || attempt === retries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}
