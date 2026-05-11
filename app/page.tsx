"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase"; 
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import ThemeToggle from "@/components/ui/ThemeToggle"; 

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<"CREATE" | "TRACK">("CREATE");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); 
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Sprzęt");
  
  const [trackId, setTrackId] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data } = await supabase.from("tickets").insert([{
        customer_email: email, 
        phone_number: phone,
        subject, 
        description, 
        category, 
        status: "AI_OPERATED"
    }]).select().single(); 
    if (data) router.push(`/chat/${data.id}`);
    setIsSubmitting(false);
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data } = await supabase.from("tickets").select("id").eq("id", trackId).eq("customer_email", trackEmail).single();
    setIsSubmitting(false);
    
    if (data) {
      router.push(`/chat/${data.id}`);
    } else {
      alert("Nie znaleziono zgłoszenia z takim numerem i adresem e-mail.");
    }
  };

  return (
    <main className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 font-sans transition-colors duration-300 relative">
      
      {/* Pływający przycisk motywu w prawym górnym rogu (Zablokowany na stałe przyciskiem fixed) */}
      <div className="fixed top-6 right-6 z-50 shadow-sm rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-1 border border-slate-200 dark:border-slate-800">
        <ThemeToggle />
      </div>

      <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-full flex gap-1 mb-8 z-20 shadow-inner mt-12">
        <button onClick={() => setView("CREATE")} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${view === "CREATE" ? "bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>Nowe zgłoszenie</button>
        <button onClick={() => setView("TRACK")} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${view === "TRACK" ? "bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>Sprawdź status</button>
      </div>

      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 p-10 md:p-16 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-48 h-48 bg-sky-400/10 dark:bg-blue-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>

        {view === "CREATE" ? (
          <>
            <header className="relative z-10 mb-12">
              <h1 className="text-4xl font-black tracking-tight mb-3 text-slate-900 dark:text-white">Pomoc Techniczna IT</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Opisz problem, a nasz asystent pomoże Ci natychmiast.</p>
            </header>

            <form onSubmit={handleCreate} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">E-mail służbowy</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-transparent dark:border-slate-800 rounded-[22px] outline-none focus:border-blue-400 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold transition-colors" placeholder="np. jan@firma.pl" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Numer telefonu</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-transparent dark:border-slate-800 rounded-[22px] outline-none focus:border-blue-400 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold transition-colors" placeholder="Dla szybkiego kontaktu" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Temat</label>
                  <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-transparent dark:border-slate-800 rounded-[22px] outline-none focus:border-blue-400 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold transition-colors" placeholder="Krótki tytuł problemu" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Kategoria</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-transparent dark:border-slate-800 rounded-[22px] outline-none focus:border-blue-400 dark:focus:border-blue-500 text-slate-900 dark:text-white font-bold transition-colors">
                    <option className="dark:bg-slate-900">Sprzęt</option><option className="dark:bg-slate-900">Oprogramowanie</option><option className="dark:bg-slate-900">Sieć</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Szczegóły</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-transparent dark:border-slate-800 rounded-[22px] outline-none focus:border-blue-400 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold min-h-[140px] transition-colors resize-none" placeholder="Opisz dokładnie objawy usterki..." />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 dark:bg-blue-600 text-white font-black py-5 rounded-[22px] hover:bg-blue-700 dark:hover:bg-blue-500 shadow-xl shadow-blue-100 dark:shadow-none transition-all active:scale-95 disabled:bg-slate-300 dark:disabled:bg-slate-700 flex justify-center items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">send</span> Wyślij zgłoszenie
              </button>
            </form>
          </>
        ) : (
          <>
            <header className="relative z-10 mb-12">
              <h1 className="text-4xl font-black tracking-tight mb-3 text-slate-900 dark:text-white">Śledzenie Zgłoszenia</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Podaj dane z e-maila potwierdzającego, aby wrócić do rozmowy.</p>
            </header>
            <form onSubmit={handleTrack} className="space-y-6 relative z-10">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Numer zgłoszenia (ID)</label>
                <input required type="number" placeholder="np. 142" value={trackId} onChange={e => setTrackId(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-transparent dark:border-slate-800 rounded-[22px] outline-none focus:border-blue-400 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold text-center text-xl transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">E-mail użyty przy zgłoszeniu</label>
                <input required type="email" placeholder="jan@firma.pl" value={trackEmail} onChange={e => setTrackEmail(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-transparent dark:border-slate-800 rounded-[22px] outline-none focus:border-blue-400 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold text-center transition-colors" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 dark:bg-slate-800 text-white font-black py-5 rounded-[22px] hover:bg-slate-800 dark:hover:bg-slate-700 shadow-xl dark:shadow-none transition-all active:scale-95 disabled:bg-slate-300 dark:disabled:bg-slate-700 flex justify-center items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">forum</span> Otwórz Czat
              </button>
            </form>
          </>
        )}

        <footer className="mt-12 text-center border-t border-slate-50 dark:border-slate-800 pt-8">
          <Link href="/admin" className="text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-[0.2em] transition-colors">Logowanie dla personelu IT</Link>
        </footer>
      </div>
    </main>
  );
}