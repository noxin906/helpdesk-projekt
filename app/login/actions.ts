'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Funkcja pomocnicza do tworzenia klienta Supabase wewnątrz akcji
async function getSupabaseClient() {
  const cookieStore = await cookies() // FIX: Obsługa asynchronicznych ciasteczek
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// 1. Logowanie
export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await getSupabaseClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/admin')
}

// 2. Wylogowanie
export async function logout() {
  const supabase = await getSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// 3. Zmiana statusu zgłoszenia
export async function updateTicketStatus(id: number, newStatus: string) {
  const supabase = await getSupabaseClient()
  
  const { error } = await supabase
    .from('tickets')
    .update({ status: newStatus })
    .eq('id', id)

  if (error) {
    console.error("Błąd aktualizacji:", error.message)
    return { error: error.message }
  }

  return { success: true }
}