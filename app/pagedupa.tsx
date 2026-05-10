"use client";

import { useState } from "react";

// Typy dla naszych wiadomości
type Message = {
  role: "user" | "bot";
  text: string;
};

export default function HelpdeskChat() {
  const [email, setEmail] = useState("");
  const [isChatStarted, setIsChatStarted] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [ticketId, setTicketId] = useState<number | null>(null);

  // Rozpoczęcie czatu (zapisanie maila)
  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setIsChatStarted(true);
  };

  // Wysyłanie wiadomości
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Dodajemy wiadomość użytkownika do okna czatu
    const userMessage: Message = { role: "user", text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // [SPRYTNY TRIK]: Zamiast wysyłać tylko jedno słowo (np. "Tak"), 
    // wysyłamy AI całą historię rozmowy, żeby bot pamiętał kontekst!
    const chatHistoryText = newMessages
      .map((m) => `${m.role === "user" ? "Użytkownik" : "Bot"}: ${m.text}`)
      .join("\n");

    try {
      // 2. Wysyłamy zapytanie do naszego backendu
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatHistoryText, // Wysyłamy cały kontekst
          ticketId: ticketId,       // Wysyłamy ID zgłoszenia (jeśli już istnieje)
          userEmail: email,         // Mail użytkownika
        }),
      });

      const data = await response.json();

      // 3. Jeśli to była pierwsza wiadomość, backend stworzył ticket - zapisujemy jego ID
      if (data.ticketId && !ticketId) {
        setTicketId(data.ticketId);
      }

      // 4. Dodajemy odpowiedź bota do okna czatu
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
      
    } catch (error) {
      console.error("Błąd komunikacji:", error);
      setMessages((prev) => [...prev, { role: "bot", text: "Przepraszamy, wystąpił błąd systemu." }]);
    } finally {
      setLoading(false);
    }
  };

  // --- EKRAN 1: Podawanie Emaila ---
  if (!isChatStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">IT Helpdesk</h1>
          <p className="text-gray-600 mb-6 text-center">Podaj swój adres e-mail, aby rozpocząć zgłoszenie awarii.</p>
          <form onSubmit={handleStartChat} className="flex flex-col gap-4">
            <input
              type="email"
              required
              placeholder="jan.kowalski@firma.pl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
              Rozpocznij czat
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- EKRAN 2: Właściwy Czat ---
  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-3xl mx-auto shadow-2xl">
      {/* Nagłówek czatu */}
      <div className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg">Wirtualny Asystent IT</h2>
          {ticketId && <p className="text-xs text-blue-200">Zgłoszenie #{ticketId}</p>}
        </div>
        <div className="text-sm bg-blue-700 py-1 px-3 rounded-full">
          {email}
        </div>
      </div>

      {/* Obszar wiadomości */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            Napisz, w czym możemy Ci dzisiaj pomóc...
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-500 p-3 rounded-2xl rounded-tl-none animate-pulse">
              Asystent pisze...
            </div>
          </div>
        )}
      </div>

      {/* Pasek wpisywania */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Opisz swój problem..."
          disabled={loading}
          className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 transition disabled:bg-blue-300"
        >
          Wyślij
        </button>
      </form>
    </div>
  );
}