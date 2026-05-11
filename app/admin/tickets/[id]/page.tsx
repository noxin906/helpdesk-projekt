"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Ticket, TicketComment } from "@/types";
import { TICKET_STATUS } from "@/constants/statuses";

type TabFilter = "ALL" | "PUBLIC" | "INTERNAL";

export default function TicketDetails({ params }: { params: Promise<{ id: string }> }) {
  const ticketId = use(params).id;
  const router = useRouter();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [ticketId]);

  const fetchData = async () => {
    const [ticketRes, commentsRes] = await Promise.all([
      supabase.from("tickets").select("*").eq("id", ticketId).single(),
      supabase.from("ticket_comments").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true })
    ]);

    if (ticketRes.data) setTicket(ticketRes.data as Ticket);
    if (commentsRes.data) setComments(commentsRes.data as TicketComment[]);
    setLoading(false);
  };

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase.from("tickets").update({ status: newStatus }).eq("id", ticketId);
    if (!error && ticket) setTicket({ ...ticket, status: newStatus });
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !ticket) return;
    setIsSubmitting(true);

    const newComment = {
      ticket_id: ticket.id,
      content: replyText,
      is_public: !isInternalNote,
      author_email: "technik@helpdesk.pl"
    };

    const { data, error } = await supabase.from("ticket_comments").insert([newComment]).select().single();

    if (!error && data) {
      setComments([...comments, data as TicketComment]);
      setReplyText("");
    }
    setIsSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pl-PL", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Ładowanie systemu...</div>;
  if (!ticket) return <div className="p-10 text-center font-bold text-red-500">Zgłoszenie nie istnieje</div>;

  return (
    <div className="flex-grow relative pb-40 bg-slate-50 min-h-screen">
      
      <header className="bg-white border-b border-slate-200 flex justify-between items-center w-full px-6 py-3 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/admin")} className="text-slate-400 hover:text-blue-600 transition">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-semibold">#{ticket.id}</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-widest ${
              ticket.status === TICKET_STATUS.CLOSED ? "bg-green-100 text-green-700" :
              ticket.status === TICKET_STATUS.IN_PROGRESS ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
            }`}>
              {ticket.status}
            </span>
          </div>
        </div>
      </header>

      <section className="bg-white px-8 py-8 border-b border-slate-200">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{ticket.customer_email || "Nieznany klient"}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Kategoria: <strong className="text-slate-700">{ticket.category}</strong> • Tel: {ticket.phone_number || "Brak"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Utworzono</span>
            <span className="text-sm font-bold text-blue-600">{formatDate(ticket.created_at)}</span>
          </div>
        </div>
      </section>

      <div className="sticky top-[61px] bg-slate-50/90 backdrop-blur-md z-30 border-b border-slate-200 px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <button onClick={() => setActiveTab("ALL")} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === "ALL" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>Wszystko</button>
            <button onClick={() => setActiveTab("PUBLIC")} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === "PUBLIC" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>Publiczne</button>
            <button onClick={() => setActiveTab("INTERNAL")} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === "INTERNAL" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>Wewnętrzne</button>
          </div>
          
          <div className="flex items-center gap-3">
            {ticket.status !== TICKET_STATUS.CLOSED && (
              <>
                {/* ZMODYFIKOWANY ZIELONY PRZYCISK */}
                <button 
                  onClick={() => updateStatus(TICKET_STATUS.IN_PROGRESS)} 
                  disabled={ticket.status === TICKET_STATUS.IN_PROGRESS}
                  className={`px-4 py-2 border rounded-lg text-sm font-bold transition-all shadow-sm ${
                    ticket.status === TICKET_STATUS.IN_PROGRESS 
                      ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" 
                      : "bg-green-600 border-green-600 text-white hover:bg-green-700 active:scale-95"
                  }`}
                >
                  {ticket.status === TICKET_STATUS.IN_PROGRESS ? "✓ Sprawa przejęta" : "Przejmij sprawę"}
                </button>

                <button onClick={() => updateStatus(TICKET_STATUS.CLOSED)} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md active:scale-95">
                  Rozwiąż zgłoszenie
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 pt-8 space-y-6 relative before:absolute before:left-[52px] before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-200 before:z-0">
        
        {(activeTab === "ALL" || activeTab === "PUBLIC") && (
          <div className="relative flex gap-6 z-10">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 border-4 border-slate-50 shadow-sm">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </div>
            <div className="flex-grow bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-lg font-bold text-slate-900">{ticket.subject}</span>
                <span className="text-xs font-semibold text-slate-400">{formatDate(ticket.created_at)}</span>
              </div>
              <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </div>
            </div>
          </div>
        )}

        {ticket.ai_notes && (activeTab === "ALL" || activeTab === "INTERNAL") && (
          <div className="relative flex gap-6 z-10">
            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 border-4 border-slate-50 shadow-sm">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
            <div className="flex-grow bg-purple-50 border border-purple-100 rounded-2xl p-6 shadow-sm border-l-4 border-l-purple-500">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-purple-900 uppercase">System AI</span>
                  <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">Diagnoza Wstępna</span>
                  {ticket.needs_attention && <span className="bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase animate-pulse">Wymaga Uwagi</span>}
                </div>
              </div>
              <p className="text-sm text-purple-800 leading-relaxed font-medium">
                {ticket.ai_notes}
              </p>
            </div>
          </div>
        )}

        {comments.filter(c => activeTab === "ALL" || (activeTab === "PUBLIC" && c.is_public) || (activeTab === "INTERNAL" && !c.is_public)).map((comment) => (
          <div key={comment.id} className="relative flex gap-6 z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-slate-50 shadow-sm ${comment.is_public ? "bg-slate-700 text-white" : "bg-amber-400 text-amber-900"}`}>
              <span className="material-symbols-outlined text-[20px]">{comment.is_public ? "reply" : "lock"}</span>
            </div>
            <div className={`flex-grow border rounded-2xl p-6 shadow-sm border-l-4 ${comment.is_public ? "bg-white border-slate-200 border-l-slate-700" : "bg-amber-50 border-amber-100 border-l-amber-400"}`}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${comment.is_public ? "text-slate-900" : "text-amber-900"}`}>{comment.author_email}</span>
                  {!comment.is_public && <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">Notatka wewn.</span>}
                </div>
                <span className="text-xs font-semibold text-slate-400">{formatDate(comment.created_at)}</span>
              </div>
              <p className={`text-sm leading-relaxed ${comment.is_public ? "text-slate-600" : "text-amber-800"}`}>
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {ticket.status !== TICKET_STATUS.CLOSED && (
        <footer className="fixed bottom-0 left-60 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setIsInternalNote(false)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!isInternalNote ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}>
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Odpowiedź do klienta
              </button>
              <button onClick={() => setIsInternalNote(true)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isInternalNote ? "bg-amber-400 text-amber-900 shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}>
                <span className="material-symbols-outlined text-[16px]">lock</span>
                Notatka wewnętrzna
              </button>
            </div>

            <div className="flex items-end gap-4">
              <div className="flex-grow relative">
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={isInternalNote ? "Dodaj prywatną notatkę dla zespołu..." : "Napisz odpowiedź do użytkownika..."}
                  className={`w-full px-5 py-4 border rounded-2xl focus:outline-none focus:ring-2 transition-all resize-none text-sm ${isInternalNote ? "bg-amber-50/50 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 placeholder:text-amber-700/50" : "bg-slate-50 border-slate-200 focus:border-blue-600 focus:ring-blue-600/20"}`} 
                  rows={2}
                ></textarea>
              </div>
              <button 
                onClick={handleSendReply}
                disabled={!replyText.trim() || isSubmitting}
                className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all shrink-0 ${isInternalNote ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"} disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
              >
                {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">send</span>}
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}