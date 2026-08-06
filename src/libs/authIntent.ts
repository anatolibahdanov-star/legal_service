const OPEN_AUTH_EVENT = 'enki:open-auth'
const PENDING_SUBSCRIPTION_PLAN_KEY = 'enki:pendingSubscriptionPlanId'
const PENDING_ONE_TIME_KEY = 'enki:pendingOneTimePurchase'

export type AuthFormKind = 'login' | 'register' | 'reset'

export type OpenAuthDetail = {
  form?: AuthFormKind
}

/** Open the site auth modal from any client component (header listens). */
export function emitOpenAuth(detail: OpenAuthDetail = {}): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<OpenAuthDetail>(OPEN_AUTH_EVENT, { detail }))
}

export function subscribeOpenAuth(handler: (detail: OpenAuthDetail) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<OpenAuthDetail>).detail ?? {}
    handler(detail)
  }
  window.addEventListener(OPEN_AUTH_EVENT, listener)
  return () => window.removeEventListener(OPEN_AUTH_EVENT, listener)
}

export function setPendingSubscriptionPlan(planId: number): void {
  if (typeof window === 'undefined') return
  try {
    clearPendingOneTimePurchase()
    sessionStorage.setItem(PENDING_SUBSCRIPTION_PLAN_KEY, String(planId))
  } catch {
    // ignore quota / private mode
  }
}

export function peekPendingSubscriptionPlan(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(PENDING_SUBSCRIPTION_PLAN_KEY)
    if (!raw) return null
    const id = Number(raw)
    return Number.isFinite(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

export function clearPendingSubscriptionPlan(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(PENDING_SUBSCRIPTION_PLAN_KEY)
  } catch {
    // ignore
  }
}

export function consumePendingSubscriptionPlan(): number | null {
  const id = peekPendingSubscriptionPlan()
  if (id !== null) clearPendingSubscriptionPlan()
  return id
}

export function setPendingOneTimePurchase(): void {
  if (typeof window === 'undefined') return
  try {
    clearPendingSubscriptionPlan()
    sessionStorage.setItem(PENDING_ONE_TIME_KEY, '1')
  } catch {
    // ignore
  }
}

export function peekPendingOneTimePurchase(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(PENDING_ONE_TIME_KEY) === '1'
  } catch {
    return false
  }
}

export function clearPendingOneTimePurchase(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(PENDING_ONE_TIME_KEY)
  } catch {
    // ignore
  }
}

export function consumePendingOneTimePurchase(): boolean {
  const pending = peekPendingOneTimePurchase()
  if (pending) clearPendingOneTimePurchase()
  return pending
}

export function clearAllPendingPurchases(): void {
  clearPendingSubscriptionPlan()
  clearPendingOneTimePurchase()
}

/** After login/register: resume the purchase intent the guest started. */
export function getPostAuthPath(role?: string | null): string {
  if (role === 'admin') return '/admin#/requests'
  if (role === 'lowyer') return '/admin/requests'
  if (peekPendingSubscriptionPlan()) return '/#subscriptions'
  if (peekPendingOneTimePurchase()) return '/#inquiry'
  return '/profile'
}
