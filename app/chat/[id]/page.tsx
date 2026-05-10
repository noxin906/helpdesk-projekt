"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // Upewnij się, że ścieżka jest poprawna
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = { role: "user" | "bot"; text: string };

export default function TicketChat({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.id;
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true); // Startujemy z loadingiem (pobieranie danych)
  const [ticketStatus, setTicketStatus] = useState("AI_OPERATED");
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // 1. POBIERANIE DANYCH Z BAZY I INICJALIZACJA CZATU
  useEffect(() => {
    const fetchTicketAndStartAI = async () => {
      try {
        // Pobieramy dane ticketu z Supabase
        const { data: ticket, error } = await supabase
          .from("tickets")
          .select("subject, description, status")
          .eq("id", ticketId)
          .single();

        if (error || !ticket) {
          console.error("Nie znaleziono ticketu:", error);
          router.push("/");
          return;
        }

        setTicketStatus(ticket.status);

        // Jeśli czat jest świeży (brak wiadomości), prosimy AI o pierwszą reakcję
        if (isFirstLoad) {
          const prompt = `Użytkownik zgłosił problem. 
          Temat: ${ticket.subject}. 
          Opis: ${ticket.description}. 
          Przeanalizuj to i przywitaj się, dopytując o szczegóły lub proponując pierwsze rozwiązanie.`;
          
          await callAI(prompt, true); // true oznacza, że to ukryty prompt startowy
          setIsFirstLoad(false);
        }
      } catch (err) {
        console.error("Błąd inicjalizacji:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketAndStartAI();
  }, [ticketId]);

  // FUNKCJA KOMUNIKACJI Z API
  const callAI = async (messageText: string, isInitial = false) => {
    setLoading(true);

    // Jeśli to nie jest start, dodajemy wiadomość usera do widoku
    if (!isInitial) {
      setMessages(prev => [...prev, { role: "user", text: messageText }]);
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          ticketId: ticketId,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
      if (data.status) setTicketStatus(data.status);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", text: "Błąd połączenia z asystentem." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    callAI(text);
  };

  const isChatActive = ticketStatus !== "CLOSED" && ticketStatus !== "ESCALATED";

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* NAGŁÓWEK */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight">AI Helpdesk</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Zgłoszenie #{ticketId} • <span className="text-blue-500">{ticketStatus}</span>
            </p>
          </div>
        </div>
        <button onClick={() => router.push("/")} className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-tighter">
          Wyjdź
        </button>
      </header>

      {/* WIADOMOŚCI */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] md:max-w-[70%] p-5 rounded-[26px] shadow-sm ${
              msg.role === "user" 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
            }`}>
              {msg.role === "user" ? (
                <p className="font-medium leading-relaxed">{msg.text}</p>
              ) : (
                <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-strong:text-blue-500">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-[22px] rounded-tl-none shadow-sm flex gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
            </div>
          </div>
        )}
      </main>

      {/* PASEK WPISYWANIA */}
      <footer className="p-4 md:p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto">
          {isChatActive ? (
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Napisz do asystenta..."
                disabled={loading}
                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent rounded-[22px] py-5 pl-7 pr-20 outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 font-bold transition-all disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={loading || !input.trim()}
                className="absolute right-3 bg-blue-600 text-white rounded-xl px-5 py-2.5 font-black hover:bg-blue-700 transition-all disabled:bg-slate-300"
              >
                WYŚLIJ
              </button>
            </form>
          ) : (
            <div className="text-center py-4 bg-slate-50 dark:bg-slate-950 rounded-[30px] border-2 border-dashed border-slate-200 dark:border-slate-800">
              <p className="font-black text-slate-400 uppercase tracking-widest mb-4">
                {ticketStatus === "CLOSED" ? "✅ PROBLEM ROZWIĄZANY" : "🛠️ PRZEKAZANO DO TECHNIKA"}
              </p>
              <button onClick={() => router.push("/")} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-[20px] font-black hover:scale-105 transition-transform shadow-xl">
                WRÓĆ DO STRONY GŁÓWNEJ
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}