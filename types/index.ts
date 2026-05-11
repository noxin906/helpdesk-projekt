// types/index.ts

export interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

export interface Ticket {
  id: number;
  created_at: string;
  customer_email: string | null;
  subject: string | null;
  description: string | null;
  status: string;
  priority: string | null;
  category: string | null;
  phone_number: string | null;
  preferred_hours: string | null;
  ip_address: string | null;
  ai_notes: string | null;
  needs_attention: boolean | null;
}

export interface TicketComment {
  id: number;
  ticket_id: number | null;
  created_at: string;
  content: string;
  is_public: boolean | null;
  author_email: string | null;
}