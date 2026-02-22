"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase"; 
import Link from "next/link";

export default function Home() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Sprzęt");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.from("tickets").insert([
      {
        customer_email: email,
        subject: subject,
        description: description,
        category: category,
        phone_number: phone,
        status: "new"
      }
    ]);

    if (error) {
      alert("Błąd wysyłania: " + error.message);
    } else {
      alert("Zgłoszenie przyjęte. Technik zajmie się sprawą.");
      setEmail(""); setSubject(""); setDescription(""); setPhone("");
    }
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-2xl w-full bg-white p-10 md:p-16 rounded-[40px] shadow-2xl border border-slate-100 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-48 h-48 bg-sky-400/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>

        <header className="relative z-10 mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Pomoc Techniczna IT</h1>
          <p className="text-slate-400 font-medium">Masz problem ze sprzętem lub dostępem? Opisz go, a pomożemy natychmiast.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail służbowy</label>
            <input 
              type="email" required placeholder="np. pracownik@firma.pl" 
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[22px] outline-none focus:border-sky-400 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-300" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numer telefonu</label>
              <input 
                type="tel" placeholder="Dla szybkiego kontaktu" 
                value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[22px] outline-none focus:border-sky-400 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-300" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Obszar problemu</label>
              <select 
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[22px] outline-none focus:border-sky-400 font-bold text-slate-900 cursor-pointer appearance-none truncate"
              >
                <option value="Sprzęt">💻 Sprzęt (PC, Laptop, Drukarka)</option>
                <option value="Oprogramowanie">💿 Oprogramowanie / System</option>
                <option value="Sieć">🌐 Sieć i Internet</option>
                <option value="Dostęp">🔐 Hasła i Uprawnienia</option>
                <option value="Inne">❓ Inne</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Temat zgłoszenia</label>
            <input 
              type="text" required placeholder="W czym tkwi problem?" 
              value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[22px] outline-none focus:border-sky-400 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-300" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Szczegóły</label>
            <textarea 
              required placeholder="Opisz dokładnie objawy usterki..." 
              value={description} onChange={e => setDescription(e.target.value)}
              className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[22px] outline-none focus:border-sky-400 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-300 min-h-[140px] resize-none" 
            />
          </div>

          {/* ZMIANA KOLORU PRZYCISKU */}
          <button 
            type="submit" disabled={isSubmitting}
            // Zmieniono 'bg-slate-900' na 'bg-blue-600' i 'hover:bg-sky-500' na 'hover:bg-blue-700'
            // aby pasował do przycisku logowania
            className="w-full bg-blue-600 text-white font-black py-5 rounded-[22px] hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all disabled:bg-slate-300 transform active:scale-95 mt-4"
          >
            {isSubmitting ? "Przesyłanie..." : "Wyślij zgłoszenie IT 🚀"}
          </button>
        </form>

        <footer className="mt-12 text-center border-t border-slate-50 pt-8">
          <Link href="/login" className="text-[10px] font-black text-slate-300 hover:text-blue-600 uppercase tracking-[0.2em] transition-all">
            Logowanie dla personelu IT
          </Link>
        </footer>
      </div>
    </main>
  );
}