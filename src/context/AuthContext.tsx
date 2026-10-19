import type { Session, User } from '@supabase/supabase-js'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'

interface Profile {
  fullName: string
  phone: string
}

interface AuthContextValue {
  ready: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (input: {
    email: string
    password: string
    fullName: string
    phone: string
  }) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function readProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null
  return { fullName: data.full_name as string, phone: data.phone as string }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setReady(true)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setReady(true)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      return
    }

    let active = true
    void readProfile(session.user.id).then((nextProfile) => {
      if (!active) return
      setProfile(nextProfile)
    })

    return () => {
      active = false
    }
  }, [session])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }, [])

  const signUp = useCallback(
    async (input: { email: string; password: string; fullName: string; phone: string }) => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { full_name: input.fullName, phone: input.phone },
        },
      })
      if (error) return error.message
      if (!data.session) return 'CONFIRM_EMAIL'
      return null
    },
    [],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      profile,
      signIn,
      signUp,
      signOut,
    }),
    [ready, session, profile, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
