"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function NewInternalTicket() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { data } = await supabase.from("tickets").insert([{
      subject, description,
      customer_email: "internal@it.helpdesk",
      status: "OPEN", // Bezpośrednio otwarte u techników
      category: "Wewnętrzne",
      needs_attention: true // Oznaczamy flagą by nikt tego nie przeoczył
    }]).select().single();

    if (data) router.push(`/admin/tickets/${data.id}`);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black mb-6">Utwórz Zgłoszenie Wewnętrzne</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-2xl space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Temat / Dla kogo?</label>
          <input required value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200" placeholder="np. Do Marka: Sprawdź serwer w serwerowni nr 2" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Szczegóły</label>
          <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 min-h-[150px]" placeholder="Opisz zadanie..." />
        </div>
        <button disabled={isSubmitting} type="submit" className="bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition">Utwórz zadanie</button>
      </form>
    </div>
  );
}