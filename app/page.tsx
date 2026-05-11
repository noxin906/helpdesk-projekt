"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase"; 
import Link from "next/link";
import { useRouter } from "next/navigation"; 

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<"CREATE" | "TRACK">("CREATE"); // Przełącznik widoku

  // Stany formularza nowgo
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Sprzęt");
  
  // Stany formularza odzyskiwania
  const [trackId, setTrackId] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data } = await supabase.from("tickets").insert([{
        customer_email: email, subject, description, category, status: "AI_OPERATED"
    }]).select().single(); 
    if (data) router.push(`/chat/${data.id}`);
    setIsSubmitting(false);
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Sprawdzamy czy zgłoszenie o takim ID należy do tego emaila
    const { data } = await supabase.from("tickets").select("id").eq("id", trackId).eq("customer_email", trackEmail).single();
    setIsSubmitting(false);
    
    if (data) {
      router.push(`/chat/${data.id}`);
    } else {
      alert("Nie znaleziono zgłoszenia z takim numerem i adresem e-mail.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Przełącznik na samej górze */}
      <div className="bg-slate-200 p-1 rounded-full flex gap-1 mb-8 z-20 shadow-inner">
        <button onClick={() => setView("CREATE")} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${view === "CREATE" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Nowe zgłoszenie</button>
        <button onClick={() => setView("TRACK")} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${view === "TRACK" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Sprawdź status</button>
      </div>

      <div className="max-w-2xl w-full bg-white p-10 md:p-16 rounded-[40px] shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-sky-400/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>

        {view === "CREATE" ? (
          <>
            <header className="relative z-10 mb-12">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Pomoc Techniczna IT</h1>
              <p className="text-slate-400 font-medium">Opisz problem, a nasz asystent pomoże Ci natychmiast.</p>
            </header>

            <form onSubmit={handleCreate} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail służbowy</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[22px] outline-none focus:border-blue-400 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Temat</label>
                  <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[22px] outline-none focus:border-blue-400 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategoria</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[22px] outline-none focus:border-blue-400 font-bold">
                    <option>Sprzęt</option><option>Oprogramowanie</option><option>Sieć</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Szczegóły</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[22px] outline-none focus:border-blue-400 font-bold min-h-[140px]" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-black py-5 rounded-[22px] hover:bg-blue-700 shadow-xl transition-all active:scale-95">Wyślij zgłoszenie 🚀</button>
            </form>
          </>
        ) : (
          <>
            <header className="relative z-10 mb-12">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Śledzenie Zgłoszenia</h1>
              <p className="text-slate-400 font-medium">Podaj dane z e-maila potwierdzającego, aby wrócić do rozmowy.</p>
            </header>
            <form onSubmit={handleTrack} className="space-y-6 relative z-10">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numer zgłoszenia (ID)</label>
                <input required type="number" placeholder="np. 142" value={trackId} onChange={e => setTrackId(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[22px] outline-none focus:border-blue-400 font-bold text-center text-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail użyty przy zgłoszeniu</label>
                <input required type="email" value={trackEmail} onChange={e => setTrackEmail(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[22px] outline-none focus:border-blue-400 font-bold text-center" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-black py-5 rounded-[22px] hover:bg-slate-800 shadow-xl transition-all active:scale-95">Otwórz Czat 💬</button>
            </form>
          </>
        )}

        <footer className="mt-12 text-center border-t border-slate-50 pt-8">
          <Link href="/admin" className="text-[10px] font-black text-slate-300 hover:text-blue-600 uppercase tracking-[0.2em]">Logowanie dla personelu IT</Link>
        </footer>
      </div>
    </main>
  );
}