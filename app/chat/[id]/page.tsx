"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = { role: "user" | "bot" | "human_admin"; text: string; date?: string };

export default function TicketChat({ params }: { params: Promise<{ id: string }> }) {
  const ticketId = use(params).id;
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [ticketStatus, setTicketStatus] = useState("AI_OPERATED");
  const [email, setEmail] = useState("");
  
  const hasInitialized = useRef(false); // Zapobiega podwójnej wiadomości AI

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const fetchTicket = async () => {
      const { data: ticket } = await supabase.from("tickets").select("*").eq("id", ticketId).single();
      if (!ticket) return router.push("/");
      
      setTicketStatus(ticket.status);
      setEmail(ticket.customer_email || "");

      // Jeśli status to AI_OPERATED lub WAITING_FOR_USER, pobierz wstęp z AI
      if (ticket.status === "AI_OPERATED" || ticket.status === "WAITING_FOR_USER") {
        const prompt = `Użytkownik ma problem: ${ticket.subject}. Opis: ${ticket.description}. Przywitaj się krótko.`;
        await callAI(prompt, true);
      } else {
        // Jeśli ticket ma inny status (ESCALATED, IN_PROGRESS, CLOSED), pobieramy historię komentarzy (Rozmowa z człowiekiem)
        const { data: comments } = await supabase.from("ticket_comments").select("*").eq("ticket_id", ticketId).eq("is_public", true).order("created_at", { ascending: true });
        
        const humanMessages: Message[] = [
          { role: "user", text: ticket.description || "" },
          ...(comments || []).map(c => ({
            role: (c.author_email === ticket.customer_email ? "user" : "human_admin") as Message["role"],
            text: c.content,
            date: new Date(c.created_at).toLocaleTimeString()
          }))
        ];
        setMessages(humanMessages);
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  const callAI = async (messageText: string, isInitial = false) => {
    setLoading(true);
    if (!isInitial) setMessages(prev => [...prev, { role: "user", text: messageText }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, ticketId }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "bot", text: data.reply }]);
      if (data.status) setTicketStatus(data.status);
    } finally {
      setLoading(false);
    }
  };

  const sendMessageToHuman = async () => {
    setLoading(true);
    setMessages(prev => [...prev, { role: "user", text: input }]);
    
    // Zapisujemy wiadomość jako komentarz w bazie (bezpośrednio do technika)
    await supabase.from("ticket_comments").insert({
      ticket_id: parseInt(ticketId), content: input, is_public: true, author_email: email
    });
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    
    // DECZYZJA: Czy wysyłamy do AI czy do żywego człowieka?
    if (ticketStatus === "ESCALATED" || ticketStatus === "IN_PROGRESS") {
      sendMessageToHuman();
    } else {
      callAI(text);
    }
  };

  const isClosed = ticketStatus === "CLOSED";
  const isHumanMode = ticketStatus === "ESCALATED" || ticketStatus === "IN_PROGRESS";

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between shadow-sm z-10">
        <div>
          <h1 className="font-black text-xl tracking-tight">{isHumanMode ? "Czat z Technikiem IT" : "AI Helpdesk"}</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Zgłoszenie #{ticketId} • <span className="text-blue-500">{ticketStatus}</span>
          </p>
        </div>
        <button onClick={() => router.push("/")} className="text-sm font-bold text-slate-400 hover:text-red-500 uppercase">Wyjdź</button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {isHumanMode && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-sm font-medium text-center">
            Asystent AI przekazał to zgłoszenie do działu IT. Poniżej możesz kontynuować rozmowę bezpośrednio z naszym technikiem.
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] md:max-w-[70%] p-5 rounded-[26px] shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-slate-200 rounded-tl-none"}`}>
              <div className="text-[10px] uppercase font-bold opacity-50 mb-1">{msg.role === "user" ? "Ty" : msg.role === "bot" ? "AI Asystent" : "Technik IT"}</div>
              {msg.role === "user" ? <p className="font-medium">{msg.text}</p> : (
                <div className="prose prose-sm max-w-none prose-strong:text-blue-600">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-slate-400 font-bold animate-pulse">Wysyłanie...</div>}
      </main>

      <footer className="p-4 md:p-8 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          {isClosed ? (
             <div className="text-center py-4 bg-slate-50 rounded-[30px] border-2 border-dashed border-slate-200">
               <p className="font-black text-slate-400 uppercase tracking-widest mb-4">✅ PROBLEM ROZWIĄZANY (CZAT ZABLOKOWANY)</p>
               <button onClick={() => router.push("/")} className="bg-slate-900 text-white px-10 py-3 rounded-xl font-bold">Wróć na stronę główną</button>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} placeholder={isHumanMode ? "Napisz do technika..." : "Napisz do asystenta AI..."} className="w-full bg-slate-50 border-2 border-transparent rounded-[22px] py-5 pl-7 pr-20 outline-none focus:border-blue-500 font-bold transition-all disabled:opacity-50" />
              <button type="submit" disabled={loading || !input.trim()} className="absolute right-3 bg-blue-600 text-white rounded-xl px-5 py-2.5 font-black hover:bg-blue-700 transition-all disabled:bg-slate-300">WYŚLIJ</button>
            </form>
          )}
        </div>
      </footer>
    </div>
  );
}