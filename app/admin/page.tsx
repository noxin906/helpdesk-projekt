"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket } from "@/types";
import { TICKET_STATUS } from "@/constants/statuses";
import Badge from "@/components/ui/Badge";

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stany do filtrowania i wyszukiwania
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "NEEDS_ATTENTION" | "OPEN">("ALL");
  
  const router = useRouter();

  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setTickets(data as Ticket[]);
      setLoading(false);
    };
    fetchTickets();
  }, []);

  // Logika filtrowania biletów
  const filteredTickets = tickets.filter((ticket) => {
    // 1. Wyszukiwanie tekstowe (po ID, temacie lub mailu)
    const matchesSearch = 
      ticket.id.toString().includes(searchQuery) ||
      (ticket.subject?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (ticket.customer_email?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Filtry z przycisków
    if (activeFilter === "NEEDS_ATTENTION") return ticket.needs_attention && ticket.status !== TICKET_STATUS.CLOSED;
    if (activeFilter === "OPEN") return ticket.status !== TICKET_STATUS.CLOSED;
    
    return true;
  });

  // Funkcja do formatowania daty
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Górny Pasek (Top Toolbar) */}
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
        <h1 className="text-xl font-black text-slate-800 hidden lg:block">Przegląd Zgłoszeń</h1>
        
        <div className="flex-1 max-w-xl mx-8 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            type="text" 
            placeholder="Szukaj po ID, emailu lub tytule zgłoszenia..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors border border-slate-200">
            <span className="material-symbols-outlined">notifications</span>
            {tickets.some(t => t.needs_attention && t.status !== TICKET_STATUS.CLOSED) && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>
        </div>
      </header>

      {/* Obszar przewijany (Workspace) */}
      <div className="flex-1 overflow-auto p-8 flex flex-col gap-6 bg-slate-50/50">
        
        {/* Pasek Filtrów */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveFilter("NEEDS_ATTENTION")} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${activeFilter === "NEEDS_ATTENTION" ? "bg-red-50 text-red-600 border-red-200" : "bg-white text-slate-500 border-slate-200"}`}>
              Wymaga akcji ({tickets.filter(t => t.needs_attention && t.status !== TICKET_STATUS.CLOSED).length})
            </button>
            <button onClick={() => setActiveFilter("OPEN")} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${activeFilter === "OPEN" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-slate-500 border-slate-200"}`}>
              Aktywne
            </button>
            <button onClick={() => setActiveFilter("ALL")} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${activeFilter === "ALL" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"}`}>
              Wszystkie ({tickets.length})
            </button>
          </div>
        </div>

          {/* TABELA DANYCH (High-Density) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="py-4 px-6 w-24">ID</th>
                    <th className="py-4 px-6 min-w-[250px]">Temat zgłoszenia</th>
                    <th className="py-4 px-6 w-64">Klient</th>
                    <th className="py-4 px-6 w-40">Status</th>
                    <th className="py-4 px-6 w-32">Kategoria</th>
                    <th className="py-4 px-6 w-48">Zaktualizowano</th>
                    <th className="py-4 px-6 w-16 text-right"></th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-bold animate-pulse">
                        Wczytywanie bazy danych...
                      </td>
                    </tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                        Brak zgłoszeń spełniających kryteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <tr 
                        key={ticket.id} 
                        onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                        className={`group cursor-pointer transition-colors ${
                          ticket.status === TICKET_STATUS.CLOSED ? "bg-slate-50/50 hover:bg-slate-50" : "hover:bg-blue-50/30"
                        }`}
                      >
                        <td className="py-3 px-6 font-bold text-slate-400">#{ticket.id}</td>
                        <td className={`py-3 px-6 font-bold truncate max-w-[250px] ${
                          ticket.status === TICKET_STATUS.CLOSED ? "text-slate-400 line-through decoration-slate-300" : "text-slate-800"
                        }`}>
                          {ticket.subject || "Brak tematu"}
                        </td>
                        <td className="py-3 px-6 text-slate-500 truncate">{ticket.customer_email || "Brak emaila"}</td>
                        <td className="py-3 px-6">
                          {/* Reużywalny komponent Badge z poprzedniego kroku */}
                          <Badge status={ticket.status} needsAttention={ticket.needs_attention} />
                        </td>
                        <td className="py-3 px-6">
                          <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                            {ticket.category === "Sprzęt" ? "💻" : ticket.category === "Oprogramowanie" ? "💿" : ticket.category === "Sieć" ? "🌐" : "❓"} 
                            {ticket.category}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-slate-400 text-xs font-medium">
                          {formatDate(ticket.created_at)}
                        </td>
                        <td className="py-3 px-6 text-right">
                          <button className="opacity-0 group-hover:opacity-100 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pasek paginacji (Stopka tabeli) */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
              <div>Widoczne zgłoszenia: {filteredTickets.length} z {tickets.length}</div>
              <div className="flex gap-1">
                <button className="px-3 py-1 hover:bg-slate-200 rounded transition-colors text-slate-600">Poprzednia</button>
                <button className="px-3 py-1 hover:bg-slate-200 rounded transition-colors text-slate-600">Następna</button>
              </div>
            </div>
          </div>

        </div>
      </main>
    
  );
}