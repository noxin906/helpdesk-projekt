// types/index.ts

// Typ dla pojedynczej wiadomości na czacie
export interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

// Typ dla zgłoszenia z bazy Supabase
export interface Ticket {
  id: number;
  created_at: string;
  customer_email: string;
  phone_number?: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  ai_notes?: string;
  needs_attention?: boolean;
}