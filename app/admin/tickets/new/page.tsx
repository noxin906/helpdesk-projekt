"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function NewInternalTicket() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { data } = await supabase.from("tickets").insert([{
      subject, 
      description,
      priority,
      customer_email: "it.internal@helpdesk.local", 
      status: "IN_PROGRESS", 
      category: "Wewnętrzne",
      needs_attention: true 
    }]).select().single();

    if (data) router.push(`/admin/tickets/${data.id}`);
  };

  return (
    <main className="flex flex-col min-h-full transition-colors duration-300">
      {/* Zablokowany Górny Pasek (Sticky Header) */}
      <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm flex-shrink-0 transition-colors">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/admin")} 
            className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white">Nowe Zadanie Wewnętrzne</h1>
        </div>
      </header>

      {/* Obszar roboczy */}
      <div className="flex-1 p-6 md:p-12 flex justify-center items-start bg-slate-50/50 dark:bg-slate-950/50 transition-colors">
        <div className="w-full max-w-3xl">
          
          {/* Główny Kontener Formularza */}
          <div className="bg-white dark:bg-slate-900 p-8 md:p-14 rounded-[40px] shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden transition-colors">
            
            {/* Dekoracyjne rozmycie w tle nawiązujące do Notatek Wewnętrznych (Bursztyn) */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 dark:bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 mb-10">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-amber-200 dark:border-amber-800/50 transition-colors">
                <span className="material-symbols-outlined text-[28px]">assignment_add</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Zleć prace zespołowi</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">To zgłoszenie zostanie dodane bezpośrednio do systemu z flagą interwencji, z pominięciem asystenta AI.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Temat zadania / Odbiorca</label>
                <input 
                  required 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)} 
                  className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[22px] outline-none focus:border-amber-400 dark:focus:border-amber-500 text-slate-900 dark:text-white font-bold transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600" 
                  placeholder="np. Do Marka: Wymiana uszkodzonego switcha na 2. piętrze" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Priorytet Systemowy</label>
                <select 
                  value={priority} 
                  onChange={e => setPriority(e.target.value)} 
                  className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[22px] outline-none focus:border-amber-400 dark:focus:border-amber-500 text-slate-900 dark:text-white font-bold transition-colors cursor-pointer appearance-none"
                >
                  <option className="dark:bg-slate-900" value="low">🟢 Niski (Planowane prace)</option>
                  <option className="dark:bg-slate-900" value="medium">🟡 Średni (Bieżąca obsługa)</option>
                  <option className="dark:bg-slate-900" value="high">🟠 Wysoki (Pilne wdrożenie)</option>
                  <option className="dark:bg-slate-900" value="critical">🔴 Krytyczny (Awaria / Pożar)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Szczegółowy opis zadania</label>
                <textarea 
                  required 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[22px] outline-none focus:border-amber-400 dark:focus:border-amber-500 text-slate-900 dark:text-white font-bold min-h-[160px] resize-none transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600" 
                  placeholder="Opisz dokładnie zakres prac, numery sprzętu, adresy IP lub porty..." 
                />
              </div>

              {/* Pasek akcji na dole formularza */}
              <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-4 mt-8 transition-colors">
                <button 
                  type="button" 
                  onClick={() => router.push("/admin")}
                  className="w-full sm:w-auto px-8 py-5 text-xs font-black text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors uppercase tracking-widest"
                >
                  Anuluj
                </button>
                <button 
                  disabled={isSubmitting} 
                  type="submit" 
                  className="w-full sm:w-auto bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black px-10 py-5 rounded-[22px] hover:bg-slate-800 dark:hover:bg-white shadow-xl dark:shadow-none transition-transform active:scale-95 disabled:bg-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? "Generowanie..." : "Utwórz zgłoszenie"}
                  {!isSubmitting && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </main>
  );
}