import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function TicketDetails({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const { id } = await params

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  )

  // Pobieramy jedno konkretne zgłoszenie po ID
  const { data: ticket } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single()

  if (!ticket) return notFound()

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link href="/admin" className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-[0.2em] mb-8 inline-block transition-colors">
          ← Powrót do listy
        </Link>

        <div className="bg-white p-10 md:p-16 rounded-[40px] shadow-2xl border border-slate-100">
          <header className="mb-10 border-b border-slate-50 pb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
                Ticket #{ticket.id}
              </span>
              <span className="text-slate-300 font-bold uppercase text-[10px]">{ticket.category}</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">{ticket.subject}</h1>
          </header>

          <section className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">Opis problemu</label>
              <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap font-medium">{ticket.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Zgłaszający</label>
                <p className="text-slate-900 font-bold">{ticket.customer_email}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Telefon</label>
                <p className="text-slate-900 font-bold">{ticket.phone_number || "Nie podano"}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data zgłoszenia</label>
                <p className="text-slate-900 font-bold">{new Date(ticket.created_at).toLocaleString('pl-PL')}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                <p className="text-blue-600 font-black uppercase text-sm">{ticket.status}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}