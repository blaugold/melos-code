export async function retryUntilResult<T>(
  condition: () => Promise<T | undefined> | T | undefined,
  option: { maxWaitTime?: number; waitTime?: number } = {}
): Promise<T> {
  const maxWaitTime = option.maxWaitTime ?? 5000
  const waitTime = option.waitTime ?? 100
  let elapsed = 0
  while (elapsed < maxWaitTime) {
    const result = await condition()
    if (result) {
      return result
    }
    await new Promise((resolve) => setTimeout(resolve, waitTime))
    elapsed += waitTime
  }
  throw new Error(`No result after maxWaitTime: ${maxWaitTime}`)
}
