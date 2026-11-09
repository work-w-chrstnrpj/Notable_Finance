import { freeModelChain } from './models'
import { QuotaExhaustedError } from './provider'

export type ModelFallback = {
  /** Model the next `run` will use. */
  readonly model: string
  /** True once the chain has advanced past the caller's original pick. */
  readonly switched: boolean
  /** Models abandoned to a spent grant, oldest first. */
  readonly exhausted: readonly string[]
  /**
   * Run `fn` with the current model. On `QuotaExhaustedError`, advance to the
   * next free model and retry; any other error propagates untouched.
   */
  run<T>(fn: (model: string) => Promise<T>): Promise<T>
}

/**
 * Walks a provider's free-quota models when a grant runs out.
 *
 * The position is sticky: once a model is abandoned it is not tried again by
 * this instance, so a multi-round tool loop pays the 403 once rather than on
 * every round. Hold one instance per chat turn.
 */
export function createModelFallback(input: {
  providerId: string | null | undefined
  model: string
  /** Called after each switch — for dev logs / persisting the working model. */
  onSwitch?: (from: string, to: string) => void
}): ModelFallback {
  const chain = freeModelChain(input.providerId, input.model)
  let index = 0
  const exhausted: string[] = []

  return {
    get model() {
      return chain[index] ?? input.model
    },
    get switched() {
      return index > 0
    },
    get exhausted() {
      return exhausted
    },
    async run<T>(fn: (model: string) => Promise<T>): Promise<T> {
      for (;;) {
        const model = chain[index] ?? input.model
        try {
          return await fn(model)
        } catch (err) {
          const spent = err instanceof QuotaExhaustedError
          if (!spent || index >= chain.length - 1) throw err
          index += 1
          exhausted.push(model)
          input.onSwitch?.(model, chain[index])
        }
      }
    }
  }
}
