import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logout, updateTicketStatus } from "../login/actions"
import { revalidatePath } from 'next/cache'

export default async function AdminPage() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
      },
    }
  )

  // Pobieranie zgłoszeń z bazy
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  // Funkcja pomocnicza do akcji przycisku statusu
  async function handleStatusUpdate(formData: FormData) {
    'use server'
    const id = Number(formData.get('id'))
    const status = formData.get('status') as string
    await updateTicketStatus(id, status)
    revalidatePath('/admin') // Odświeża listę po zmianie
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Nagłówek panelu */}
        <div className="flex justify-between items-center mb-10 bg-white p-8 rounded-[30px] shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Panel Agenta IT</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Zarządzanie zgłoszeniami</p>
          </div>
          <form action={logout}>
            <button type="submit" className="bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 font-bold px-6 py-3 rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em] border border-transparent hover:border-red-100">
              Wyloguj 🚪
            </button>
          </form>
        </div>

        {/* Lista zgłoszeń */}
        <div className="space-y-4">
          {tickets?.map((ticket) => (
            <div key={ticket.id} className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                    ticket.status === 'new' ? 'bg-blue-100 text-blue-600' : 
                    ticket.status === 'in_progress' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {ticket.status === 'new' ? 'Nowe' : ticket.status === 'in_progress' ? 'W toku' : 'Zakończone'}
                  </span>
                  <span className="text-slate-300 text-[10px] font-bold uppercase">{ticket.category}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">{ticket.subject}</h3>
                <p className="text-slate-500 text-sm mb-3">{ticket.description}</p>
                <div className="text-[11px] font-bold text-slate-400">
                  Od: <span className="text-slate-900">{ticket.customer_email}</span> 
                  {ticket.phone_number && <span className="ml-3">Tel: <span className="text-slate-900">{ticket.phone_number}</span></span>}
                </div>
              </div>

              {/* Akcje zmiany statusu */}
              <div className="flex gap-2">
                <form action={handleStatusUpdate}>
                  <input type="hidden" name="id" value={ticket.id} />
                  <input type="hidden" name="status" value="in_progress" />
                  <button type="submit" className="p-3 bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-xl transition-all text-[10px] font-black uppercase">W toku</button>
                </form>
                <form action={handleStatusUpdate}>
                  <input type="hidden" name="id" value={ticket.id} />
                  <input type="hidden" name="status" value="resolved" />
                  <button type="submit" className="p-3 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-all text-[10px] font-black uppercase">Zakończ</button>
                </form>
              </div>
            </div>
          ))}

          {(!tickets || tickets.length === 0) && (
            <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
              <p className="text-slate-300 font-black uppercase tracking-widest">Brak aktywnych zgłoszeń ☕</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}