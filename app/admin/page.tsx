import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { logout, deleteTicket } from "../login/actions"

export default async function AdminPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 
    {
      cookies: { get(name: string) { return cookieStore.get(name)?.value } }
    }
  )

  const { data: tickets } = await supabase.from('tickets').select('*').order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Panel IT</h1>
          <form action={logout}>
            <button type="submit" className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors">Wyloguj 🚪</button>
          </form>
        </header>

        <div className="grid gap-4">
          {tickets?.map((t) => (
            <div key={t.id} className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-all">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest ${
                    t.status === 'new' ? 'bg-blue-600 text-white' : 
                    t.status === 'in_progress' ? 'bg-amber-400 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {t.status === 'new' ? 'Nowe' : t.status === 'in_progress' ? 'W toku' : 'Zakończone'}
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.category}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">{t.subject}</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">{t.customer_email}</p>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <Link href={`/admin/tickets/${t.id}`} className="flex-1 text-center bg-slate-900 text-white px-6 py-4 md:py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                  Otwórz 📄
                </Link>
                
                <form action={async () => { 'use server'; await deleteTicket(t.id); }} className="flex-1 md:flex-none">
                  <button type="submit" className="w-full bg-red-50 text-red-600 px-6 py-4 md:py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                    Usuń 🗑️
                  </button>
                </form>
              </div>
            </div>
          ))}

          {(!tickets || tickets.length === 0) && (
            <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
              <p className="text-slate-300 font-black uppercase tracking-widest text-sm">Brak zgłoszeń ☕</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}