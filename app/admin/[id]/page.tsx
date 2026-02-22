"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// --- INTERFEJSY DANYCH ---
interface Comment {
  id: number;
  created_at: string;
  content: string;
  is_public: boolean;
  author_email: string;
}

interface Ticket {
  id: number;
  created_at: string;
  customer_email: string;
  phone_number: string;
  preferred_hours: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  ip_address: string;
}

export default function TicketDetails() {
  const params = useParams();
  const router = useRouter();
  
  // Stany aplikacji
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Stany formularza komentarza
  const [newComment, setNewComment] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await checkUser();
      if (params.id) {
        await fetchData(params.id as string);
      }
    };
    initialize();
  }, [params.id]);

  // 1. Sprawdzenie czy admin jest zalogowany
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login"); // Jeśli nie zalogowany, wyrzuć do logowania
    } else {
      setAdminEmail(user.email ?? "Nieznany Admin");
    }
  };

  // 2. Pobranie danych zgłoszenia i historii komentarzy
  const fetchData = async (id: string) => {
    setIsLoading(true);
    try {
      const [ticketRes, commentsRes] = await Promise.all([
        supabase.from("tickets").select("*").eq("id", id).single(),
        supabase.from("ticket_comments").select("*").eq("ticket_id", id).order("created_at", { ascending: false })
      ]);

      if (ticketRes.error) throw ticketRes.error;
      setTicket(ticketRes.data);
      setComments(commentsRes.data || []);
    } catch (err) {
      console.error("Błąd pobierania danych:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Zapisanie zmian: Nowy status + Komentarz (z autorem)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !newComment.trim() || !adminEmail) {
      alert("Wpisz treść komentarza!");
      return;
    }

    setIsSubmitting(true);
    try {
      // A. Dodaj komentarz z przypisanym e-mailem admina
      const { error: commentErr } = await supabase
        .from("ticket_comments")
        .insert([{ 
          ticket_id: ticket.id, 
          content: newComment, 
          is_public: isPublic,
          author_email: adminEmail 
        }]);

      // B. Zaktualizuj status zgłoszenia
      const { error: ticketErr } = await supabase
        .from("tickets")
        .update({ status: ticket.status })
        .eq("id", ticket.id);

      if (commentErr || ticketErr) throw new Error("Błąd zapisu danych");

      // C. Reset i odświeżenie
      setNewComment("");
      setIsPublic(false);
      await fetchData(ticket.id.toString());
      alert("Zmiany zapisane pomyślnie!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTicket = async () => {
    if (!confirm("Czy na pewno chcesz trwale usunąć to zgłoszenie?")) return;
    const { error } = await supabase.from("tickets").delete().eq("id", ticket?.id);
    if (!error) router.push("/admin");
  };

  if (isLoading) return <div className="p-20 text-center font-bold text-slate-400 animate-pulse">Autoryzacja i wczytywanie...</div>;
  if (!ticket) return <div className="p-20 text-center text-red-500 font-bold">Zgłoszenie nie zostało znalezione.</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Top bar */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold transition-colors">
            ⬅️ Powrót do listy
          </Link>
          <div className="text-[10px] font-black bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm text-slate-400 uppercase tracking-widest">
            Zalogowany jako: <span className="text-blue-600">{adminEmail}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* KOLUMNA LEWA: Detale i Historia */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                  {ticket.category}
                </span>
                <span className="text-slate-300 font-bold">ID #{ticket.id}</span>
              </div>
              
              <h1 className="text-3xl font-black text-slate-900 mb-8 leading-tight">{ticket.subject}</h1>
              
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Treść wiadomości</p>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap mb-10">
                {ticket.description}
              </div>

              {/* Sekcja Komentarzy */}
              <div className="border-t border-slate-100 pt-10">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  💬 Historia Komunikacji
                </h3>
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-slate-400 text-sm italic">Brak komentarzy do tego zgłoszenia.</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className={`p-6 rounded-[30px] border transition-all ${c.is_public ? 'bg-blue-50/50 border-blue-100 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${c.is_public ? 'bg-blue-600 text-white' : 'bg-slate-400 text-white'}`}>
                              {c.is_public ? 'Dla Klienta' : 'Wewnętrzny'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">✍️ {c.author_email}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold">{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* KOLUMNA PRAWA: Akcje i Info */}
          <div className="space-y-6">
            
            {/* Formularz Zmiany */}
            <form onSubmit={handleUpdate} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-5">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Zarządzaj zgłoszeniem</h3>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 ml-1">Zmień status</label>
                <select 
                  value={ticket.status} 
                  onChange={(e) => setTicket({...ticket, status: e.target.value})}
                  className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Nowe">🔵 Status: Nowe</option>
                  <option value="W toku">🟡 Status: W toku</option>
                  <option value="Rozwiązane">🟢 Status: Rozwiązane</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 ml-1">Komentarz / Odpowiedź</label>
                <textarea 
                  required
                  placeholder="Co robimy z tym zgłoszeniem?"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl text-sm min-h-[150px] outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors group">
                <input 
                  type="checkbox" 
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 rounded-lg cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">Widoczny dla klienta</span>
                  <span className="text-[9px] text-slate-400 font-bold">Oznacz jako oficjalną odpowiedź</span>
                </div>
              </label>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all disabled:bg-slate-300"
              >
                {isSubmitting ? "Zapisywanie..." : "Zapisz i powiadom 💾"}
              </button>
            </form>

            {/* Dane techniczne (Sidebar) */}
            <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">Info o kliencie</h3>
              
              <div className="space-y-6 text-sm">
                <div>
                  <p className="text-[10px] text-blue-400 font-black uppercase mb-1">E-mail</p>
                  <p className="font-bold break-all">{ticket.customer_email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 font-black uppercase mb-1">Telefon</p>
                  <p className="font-bold text-xl">{ticket.phone_number || "---"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 font-black uppercase mb-1">Dzwonić w godz.</p>
                  <p className="font-medium text-slate-300">{ticket.preferred_hours || "Dowolne"}</p>
                </div>
                <div className="pt-6 border-t border-slate-800 flex flex-col gap-2">
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Meta-dane</p>
                  <span className="font-mono text-[9px] text-slate-400">IP: {ticket.ip_address}</span>
                  <span className="font-mono text-[9px] text-slate-400">Data: {new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <button 
                onClick={deleteTicket} 
                className="w-full mt-10 bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all"
              >
                Usuń zgłoszenie
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}