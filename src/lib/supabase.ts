import { createClient } from '@supabase/supabase-js'

function readRequiredEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  const value = import.meta.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local.`)
  }
  return value
}

function isServiceRoleJwt(key: string): boolean {
  const parts = key.split('.')
  if (parts.length !== 3) return false

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64)) as { role?: string }
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

function assertBrowserSafeKey(key: string): void {
  if (key.startsWith('sb_secret_') || isServiceRoleJwt(key)) {
    throw new Error('Supabase secret keys cannot be used in the browser client.')
  }
}

const supabaseUrl = readRequiredEnv('VITE_SUPABASE_URL')
const supabaseAnonKey = readRequiredEnv('VITE_SUPABASE_ANON_KEY')

assertBrowserSafeKey(supabaseAnonKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
