'use server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
        remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await getSupabase()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/admin')
}

export async function logout() {
  const supabase = await getSupabase()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function deleteTicket(id: number) {
  const supabase = await getSupabase()
  await supabase.from('tickets').delete().eq('id', id)
  revalidatePath('/admin')
}

export async function updateTicketWithComment(id: number, status: string, comment: string) {
  const supabase = await getSupabase()
  
  // Pobieramy obecny opis, żeby dokleić do niego komentarz technika
  const { data: ticket } = await supabase.from('tickets').select('description').eq('id', id).single()
  const currentDescription = ticket?.description || ""
  
  // Jeśli jest komentarz, doklejamy go ładnie na dole
  const newDescription = comment 
    ? `${currentDescription}\n\n[NOTATKA AGENTA]: ${comment}\n---` 
    : currentDescription

  await supabase
    .from('tickets')
    .update({ 
      status: status,
      description: newDescription
    })
    .eq('id', id)

  revalidatePath(`/admin/tickets/${id}`)
  revalidatePath('/admin')
}