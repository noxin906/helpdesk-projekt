"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Ticket } from "@/types";
import { TICKET_STATUS } from "@/constants/statuses";
import Badge from "@/components/ui/Badge";

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "NEEDS_ATTENTION" | "OPEN">("ALL");
  const router = useRouter();

  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
      if (!error && data) setTickets(data as Ticket[]);
      setLoading(false);
    };
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.id.toString().includes(searchQuery) || (ticket.subject?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || (ticket.customer_email?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === "NEEDS_ATTENTION") return ticket.needs_attention && ticket.status !== TICKET_STATUS.CLOSED;
    if (activeFilter === "OPEN") return ticket.status !== TICKET_STATUS.CLOSED;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between flex-shrink-0 z-10 shadow-sm transition-colors">
        <h1 className="text-xl font-black text-slate-800 dark:text-white hidden lg:block">Przegląd Zgłoszeń</h1>
        
        <div className="flex-1 max-w-xl mx-8 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            type="text" placeholder="Szukaj po ID, emailu lub tytule zgłoszenia..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-12 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveFilter("NEEDS_ATTENTION")} className="relative p-2 text-slate-400 hover:text-red-600 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full transition-all">
            <span className="material-symbols-outlined">notifications</span>
            {tickets.some(t => t.needs_attention && t.status !== TICKET_STATUS.CLOSED) && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveFilter("NEEDS_ATTENTION")} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${activeFilter === "NEEDS_ATTENTION" ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
              Wymaga akcji ({tickets.filter(t => t.needs_attention && t.status !== TICKET_STATUS.CLOSED).length})
            </button>
            <button onClick={() => setActiveFilter("OPEN")} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${activeFilter === "OPEN" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
              Aktywne
            </button>
            <button onClick={() => setActiveFilter("ALL")} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${activeFilter === "ALL" ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
              Wszystkie ({tickets.length})
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-6 w-24">ID</th><th className="py-4 px-6 min-w-[250px]">Temat zgłoszenia</th><th className="py-4 px-6 w-64">Klient</th><th className="py-4 px-6 w-40">Status</th><th className="py-4 px-6 w-32">Kategoria</th><th className="py-4 px-6 w-48">Zaktualizowano</th><th className="py-4 px-6 w-16 text-right"></th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400 font-bold animate-pulse">Wczytywanie bazy danych...</td></tr>
                ) : filteredTickets.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400 font-bold">Brak zgłoszeń spełniających kryteria.</td></tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} onClick={() => router.push(`/admin/tickets/${ticket.id}`)} className={`group cursor-pointer transition-colors ${ticket.status === TICKET_STATUS.CLOSED ? "bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800" : "hover:bg-blue-50/30 dark:hover:bg-slate-800/60"}`}>
                      <td className="py-3 px-6 font-bold text-slate-400 dark:text-slate-500">#{ticket.id}</td>
                      <td className={`py-3 px-6 font-bold truncate max-w-[250px] ${ticket.status === TICKET_STATUS.CLOSED ? "text-slate-400 dark:text-slate-600 line-through decoration-slate-300 dark:decoration-slate-700" : "text-slate-800 dark:text-slate-200"}`}>{ticket.subject || "Brak tematu"}</td>
                      <td className="py-3 px-6 text-slate-500 dark:text-slate-400 truncate">{ticket.customer_email || "Brak emaila"}</td>
                      <td className="py-3 px-6"><Badge status={ticket.status} needsAttention={ticket.needs_attention} /></td>
                      <td className="py-3 px-6 text-slate-500 dark:text-slate-400 font-medium">
                        {ticket.category === "Sprzęt" ? "💻" : ticket.category === "Oprogramowanie" ? "💿" : ticket.category === "Sieć" ? "🌐" : "❓"} {ticket.category}
                      </td>
                      <td className="py-3 px-6 text-slate-400 dark:text-slate-500 text-xs font-medium">{formatDate(ticket.created_at)}</td>
                      <td className="py-3 px-6 text-right">
                        <button className="opacity-0 group-hover:opacity-100 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg transition-all">
                          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <div>Widoczne zgłoszenia: {filteredTickets.length} z {tickets.length}</div>
          </div>
        </div>
      </div>
    </main>
  );
}