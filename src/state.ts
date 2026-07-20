import { type Session, type User, type SupabaseClient } from '@supabase/supabase-js'

export let currentSession: Session | null = null
export let resolveAuthReady: () => void = () => {}
export const authReady = new Promise<void>((resolve) => {
  resolveAuthReady = resolve
})
export const setCurrentSession = (session: Session | null) => {
  currentSession = session
}
