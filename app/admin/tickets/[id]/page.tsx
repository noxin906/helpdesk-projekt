import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { updateTicketWithComment } from "../../../login/actions"

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const { id } = await params
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 
    {
      cookies: { get(name: string) { return cookieStore.get(name)?.value } }
    }
  )

  const { data: ticket } = await supabase.from('tickets').select('*').eq('id', id).single()
  
  if (!ticket) return notFound()

  async function handleAction(formData: FormData) {
    'use server'
    const status = formData.get('status') as string
    const comment = formData.get('comment') as string
    await updateTicketWithComment(Number(id), status, comment)
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin" className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase mb-8 inline-block tracking-widest">
          ← Powrót do listy
        </Link>
        
        <div className="bg-white p-8 md:p-12 rounded-[40px] md:rounded-[50px] shadow-2xl border border-slate-100 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-wrap items-center gap-3 mb-6">
             <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${
                ticket.status === 'new' ? 'bg-blue-600 text-white' : 
                ticket.status === 'in_progress' ? 'bg-amber-400 text-white' : 'bg-emerald-500 text-white'
             }`}>
               {ticket.status === 'new' ? 'Nowe' : ticket.status === 'in_progress' ? 'W toku' : 'Zakończone'}
             </span>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zgłoszenie #{ticket.id}</span>
          </div>
          
          <h1 className="relative z-10 text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-8">{ticket.subject}</h1>
          
          <div className="relative z-10">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-4">Treść zgłoszenia (oraz notatki)</label>
            <p className="text-slate-700 bg-slate-50 p-6 md:p-8 rounded-[30px] border border-slate-100 whitespace-pre-wrap font-medium leading-relaxed">
              {ticket.description}
            </p>
          </div>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[40px] md:rounded-[50px] shadow-2xl border border-slate-100">
          <h2 className="text-xs font-black uppercase text-slate-900 mb-8 tracking-[0.2em]">Aktualizacja statusu i notatki</h2>
          
          <form action={handleAction} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['new', 'in_progress', 'resolved'].map((s) => (
                <label key={s} className="cursor-pointer">
                  <input type="radio" name="status" value={s} defaultChecked={ticket.status === s} className="peer sr-only" />
                  <div className="p-4 border-2 border-slate-50 rounded-2xl text-center font-black text-[10px] uppercase tracking-widest transition-all peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-600">
                    {s === 'new' ? 'Nowe' : s === 'in_progress' ? 'W toku' : 'Zakończone'}
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2">Dodaj notatkę technika (opcjonalnie)</label>
              <textarea 
                name="comment" 
                placeholder="Np. Wymieniono dysk na nowy SSD..." 
                className="w-full p-6 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-blue-600 outline-none font-bold text-slate-900 placeholder:text-slate-300 resize-none"
                rows={4}
              />
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[0.98] transition-all">
              Zapisz aktualizację 💾
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}