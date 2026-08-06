export type PostAuthIntentT =
    | { kind: 'topup' }
    | { kind: 'plan'; planId: number | null; planName: string }

interface StoredIntentI {
    intent: PostAuthIntentT
    createdAt: number
}

const KEY = 'enki:post-auth-intent'
const TTL_MS = 30 * 60 * 1000

const read = (): PostAuthIntentT | null => {
    try {
        const raw = sessionStorage.getItem(KEY)
        if (!raw) return null
        const stored = JSON.parse(raw) as StoredIntentI
        const intent = stored?.intent
        const fresh = typeof stored?.createdAt === 'number' && Date.now() - stored.createdAt < TTL_MS
        if (!intent || !fresh) {
            sessionStorage.removeItem(KEY)
            return null
        }
        if (intent.kind === 'topup') return intent
        if (intent.kind === 'plan' && typeof intent.planName === 'string') return intent
        sessionStorage.removeItem(KEY)
        return null
    } catch {
        return null
    }
}

export const setPostAuthIntent = (intent: PostAuthIntentT): void => {
    try {
        sessionStorage.setItem(KEY, JSON.stringify({ intent, createdAt: Date.now() }))
    } catch {}
}

export const clearPostAuthIntent = (): void => {
    try {
        sessionStorage.removeItem(KEY)
    } catch {}
}

export const peekPostAuthIntent = (): PostAuthIntentT | null => read()

export const consumePostAuthRedirect = (): string | null => {
    const intent = read()
    if (!intent) return null
    if (intent.kind === 'topup') {
        clearPostAuthIntent()
        return '/profile/?tab=balance'
    }
    return '/#subscriptions'
}
