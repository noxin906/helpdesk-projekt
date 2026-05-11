"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ThemeToggle from "@/components/ui/ThemeToggle"; 

type Message = { role: "user" | "bot" | "human_admin"; text: string };

export default function TicketChat({ params }: { params: Promise<{ id: string }> }) {
  const ticketId = use(params).id;
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [ticketStatus, setTicketStatus] = useState("AI_OPERATED");
  const [email, setEmail] = useState("");
  const [ticketData, setTicketData] = useState<any>(null);
  
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const fetchTicketAndHistory = async () => {
      const { data: ticket } = await supabase.from("tickets").select("*").eq("id", ticketId).single();
      if (!ticket) return router.push("/");
      
      setTicketStatus(ticket.status);
      setEmail(ticket.customer_email || "");
      setTicketData(ticket);

      const { data: comments } = await supabase.from("ticket_comments").select("*").eq("ticket_id", ticketId).eq("is_public", true).order("created_at", { ascending: true });

      if (comments && comments.length > 0) {
        const historyMessages: Message[] = comments.map(c => ({
          role: c.author_email === ticket.customer_email ? "user" : (c.author_email === "ai@helpdesk.pl" ? "bot" : "human_admin"),
          text: c.content
        }));
        setMessages(historyMessages);
        setLoading(false);
      } else {
        if (ticket.status === "AI_OPERATED" || ticket.status === "WAITING_FOR_USER") {
          const prompt = `Użytkownik ma problem: ${ticket.subject}. Opis: ${ticket.description}. Przywitaj się krótko.`;
          await callAI(prompt, true, []); 
        } else { setLoading(false); }
      }
    };
    fetchTicketAndHistory();
  }, [ticketId]);

  const callAI = async (messageText: string, isInitial = false, history: Message[] = []) => {
    setLoading(true);
    if (!isInitial) {
      setMessages(prev => [...prev, { role: "user", text: messageText }]);
      await supabase.from("ticket_comments").insert({ ticket_id: parseInt(ticketId), content: messageText, is_public: true, author_email: email });
    }
    const chatHistoryText = history.map(m => `${m.role === 'user' ? 'Klient' : 'AI'}: ${m.text}`).join('\n');
    const payloadPrompt = isInitial ? messageText : `INFORMACJE O ZGŁOSZENIU:\nTemat: ${ticketData?.subject}\nPierwotny opis: ${ticketData?.description}\n\nHISTORIA ROZMOWY:\n${chatHistoryText}\n\nNOWA WIADOMOŚĆ KLIENTA: ${messageText}\n\nZADANIE: Odpowiedz klientowi jako asystent IT, kontynuując powyższą rozmowę.`;

    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: payloadPrompt, ticketId }) });
      const data = await res.json();
      await supabase.from("ticket_comments").insert({ ticket_id: parseInt(ticketId), content: data.reply, is_public: true, author_email: "ai@helpdesk.pl" });
      setMessages(prev => [...prev, { role: "bot", text: data.reply }]);
      if (data.status) setTicketStatus(data.status);
    } finally { setLoading(false); }
  };

  const sendMessageToHuman = async () => {
    setLoading(true);
    setMessages(prev => [...prev, { role: "user", text: input }]);
    await supabase.from("ticket_comments").insert({ ticket_id: parseInt(ticketId), content: input, is_public: true, author_email: email });
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input; setInput("");
    if (ticketStatus === "ESCALATED" || ticketStatus === "IN_PROGRESS") { sendMessageToHuman(); } else { callAI(text, false, messages); }
  };

  const isClosed = ticketStatus === "CLOSED";
  const isHumanMode = ticketStatus === "ESCALATED" || ticketStatus === "IN_PROGRESS";

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shadow-sm z-10 transition-colors">
        <div>
          <h1 className="font-black text-xl tracking-tight">{isHumanMode ? "Czat z Technikiem IT" : "AI Helpdesk"}</h1>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Zgłoszenie #{ticketId} • <span className="text-blue-500 dark:text-blue-400">{ticketStatus}</span>
          </p>
        </div>
        
        {/* Przycisk motywu obok przycisku wyjścia */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button onClick={() => router.push("/")} className="flex items-center gap-1 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-red-500 uppercase transition-colors">
            <span className="material-symbols-outlined text-[18px]">logout</span> Wyjdź
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {isHumanMode && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-4 rounded-2xl text-sm font-medium text-center shadow-sm">
            Asystent AI przekazał to zgłoszenie do działu IT. Poniżej możesz kontynuować rozmowę bezpośrednio z naszym technikiem.
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] md:max-w-[70%] p-5 rounded-[26px] shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-none text-slate-800 dark:text-slate-200"}`}>
              <div className="text-[10px] uppercase font-bold opacity-50 mb-1">{msg.role === "user" ? "Ty" : msg.role === "bot" ? "AI Asystent" : "Technik IT"}</div>
              {msg.role === "user" ? <p className="font-medium">{msg.text}</p> : (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-strong:text-blue-600 dark:prose-strong:text-blue-400 text-slate-700 dark:text-slate-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-slate-400 dark:text-slate-600 font-bold animate-pulse pl-4 flex items-center gap-2"><span className="material-symbols-outlined animate-spin">sync</span> Asystent pisze...</div>}
      </main>

      <footer className="p-4 md:p-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-4xl mx-auto">
          {isClosed ? (
             <div className="text-center py-4 bg-slate-50 dark:bg-slate-950 rounded-[30px] border-2 border-dashed border-slate-200 dark:border-slate-800">
               <p className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">✅ PROBLEM ROZWIĄZANY (CZAT ZABLOKOWANY)</p>
               <button onClick={() => router.push("/")} className="bg-slate-900 dark:bg-slate-800 text-white px-10 py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-700">Wróć na stronę główną</button>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} placeholder={isHumanMode ? "Napisz do technika..." : "Napisz do asystenta AI..."} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[22px] py-5 pl-7 pr-20 outline-none focus:border-blue-500 dark:focus:border-blue-500 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all disabled:opacity-50" />
              <button type="submit" disabled={loading || !input.trim()} className="absolute right-3 bg-blue-600 dark:bg-blue-600 text-white rounded-xl px-5 py-2.5 font-black hover:bg-blue-700 dark:hover:bg-blue-500 transition-all disabled:bg-slate-300 dark:disabled:bg-slate-700 flex justify-center items-center">
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          )}
        </div>
      </footer>
    </div>
  );
}