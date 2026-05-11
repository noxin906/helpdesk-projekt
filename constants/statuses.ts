// constants/statuses.ts

export const TICKET_STATUS = {
  NEW: "new",
  AI_OPERATED: "AI_OPERATED",
  WAITING_FOR_USER: "WAITING_FOR_USER",
  IN_PROGRESS: "IN_PROGRESS",
  ESCALATED: "ESCALATED",
  CLOSED: "CLOSED",
} as const;

// Typ wyciągnięty ze stałych (TypeScript będzie nas pilnował)
export type TicketStatusType = keyof typeof TICKET_STATUS | string;