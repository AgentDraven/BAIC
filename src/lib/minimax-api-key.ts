export const MINIMAX_API_KEY_ENV = "MINIMAX_API_KEY"

export function isMinimaxApiKeyMissingError(error: string | null | undefined): boolean {
  if (!error) return false
  return /miniMax api key missing/i.test(error)
}