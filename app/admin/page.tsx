import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { logout, updateTicketStatus } from "../login/actions"
import { revalidatePath } from 'next/cache'

export default async function AdminPage() {
  // FIX: W nowym Next.js cookies() muszą być asynchroniczne
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

  // Pobieranie wszystkich zgłoszeń posortowanych od najnowszych
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  // Lokalna funkcja do szybkiej zmiany statusu bezpośrednio z listy
  async function handleStatusUpdate(formData: FormData) {
    'use server'
    const id = Number(formData.get('id'))
    const status = formData.get('status') as string
    await updateTicketStatus(id, status)
    revalidatePath('/admin') // Odświeża widok, aby pokazać nowy status
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Nagłówek Panelu - styl spójny z formularzem */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white p-8 rounded-[35px] shadow-sm border border-slate-100 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Panel Agenta IT</h1>
            <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Zarządzanie Systemem</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[10px] font-bold text-slate-300 hover:text-slate-600 uppercase tracking-widest transition-all">Strona główna</Link>
            <form action={logout}>
              <button type="submit" className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-black px-6 py-3 rounded-2xl transition-all text-[10px] uppercase tracking-widest border border-red-100">
                Wyloguj 🚪
              </button>
            </form>
          </div>
        </div>

        {/* Siatka zgłoszeń */}
        <div className="grid gap-6">
          {tickets?.map((ticket) => (
            <div key={ticket.id} className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between gap-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.15em] ${
                    ticket.status === 'new' ? 'bg-blue-600 text-white' : 
                    ticket.status === 'in_progress' ? 'bg-amber-400 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {ticket.status === 'new' ? 'Nowe' : ticket.status === 'in_progress' ? 'W toku' : 'Zakończone'}
                  </span>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{ticket.category}</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 leading-tight">{ticket.subject}</h3>
                
                {/* Ucinanie opisu, aby lista była czytelna */}
                <p className="text-slate-500 text-sm font-medium line-clamp-2">{ticket.description}</p>
                
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">
                    Klient: <span className="text-slate-900 ml-1">{ticket.customer_email}</span>
                  </div>
                  {ticket.phone_number && (
                    <div className="text-[11px] font-bold text-slate-400 uppercase">
                      Tel: <span className="text-slate-900 ml-1">{ticket.phone_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Przyciski Akcji */}
              <div className="flex flex-row md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-50 pt-6 md:pt-0 md:pl-8">
                
                {/* Przycisk otwierający szczegóły - Dynamic Route */}
                <Link 
                  href={`/admin/tickets/${ticket.id}`}
                  className="flex-1 md:flex-none bg-slate-900 text-white hover:bg-blue-600 text-[10px] font-black py-4 px-6 rounded-2xl transition-all uppercase tracking-widest text-center"
                >
                  Otwórz 📄
                </Link>

                <div className="flex gap-2">
                  <form action={handleStatusUpdate} className="flex-1">
                    <input type="hidden" name="id" value={ticket.id} />
                    <input type="hidden" name="status" value="in_progress" />
                    <button type="submit" className="w-full bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 p-4 rounded-2xl transition-all text-[9px] font-black uppercase tracking-tighter">
                      W toku
                    </button>
                  </form>
                  <form action={handleStatusUpdate} className="flex-1">
                    <input type="hidden" name="id" value={ticket.id} />
                    <input type="hidden" name="status" value="resolved" />
                    <button type="submit" className="w-full bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 p-4 rounded-2xl transition-all text-[9px] font-black uppercase tracking-tighter">
                      Gotowe
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}

          {(!tickets || tickets.length === 0) && (
            <div className="text-center py-32 bg-white rounded-[50px] border-4 border-dashed border-slate-50">
              <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-sm">Brak zgłoszeń do przetworzenia ☕</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}