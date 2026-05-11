
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const systemInstruction = `Jesteś asystentem IT Helpdesk zintegrowanym w firmowym systemie biletowym.
Prowadzisz z użytkownikiem diagnozę.Użytkownik wypełnił już formularz zgłoszeniowy, a Ty prowadzisz z nim diagnozę w dedykowanym, jednorazowym oknie czatu.

BARDZO WAŻNE ZASADY ZACHOWANIA:
1. Jesteś formalny, profesjonalny i zwięzły. Używasz formatowania Markdown (pogrubienia, wypunktowania) do pisania instrukcji.
2. Rozmowa dotyczy TYLKO bieżącego problemu technicznego.
3. ZAKOŃCZENIE SUKCESEM: Jeśli rozwiążesz problem, ustaw status na "CLOSED" i pożegnaj się.
4. PRZEKAZANIE DO TECHNIKA: Jeśli nie znasz odpowiedzi, problem wymaga uprawnień administratora lub instrukcja nie pomogła - WYMAGANA JEST ESKALACJA. Poinformuj użytkownika, że przekazujesz sprawę do człowieka, ustaw status na "ESCALATED" i "ai_failed" na true.

Zawsze odpowiadaj w formacie JSON:
{
  "message_for_user": "Sformatowany tekst",
  "status": "WAITING_FOR_USER" | "CLOSED" | "ESCALATED",
  "ai_failed": true/false,
  "summary": "Krótki raport dla technika, co zawiodło"
}`;

export async function POST(req: Request) {
  try {
    const { message, ticketId, userEmail } = await req.json();
    let currentTicketId = ticketId;

    if (!currentTicketId) {
      const { data: newTicket } = await supabase.from('tickets').insert({
        subject: 'Nowe zgłoszenie', customer_email: userEmail, status: 'AI_OPERATED', description: message
      }).select().single();
      currentTicketId = newTicket?.id;
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite", systemInstruction, generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(message);
    const aiResponse = JSON.parse(result.response.text());

    const updateData: any = { ai_notes: aiResponse.summary };

    // KLUCZOWA POPRAWKA: Jeśli AI się poddaje, zapalamy czerwoną lampkę i zmieniamy status
    if (aiResponse.status === 'ESCALATED' || aiResponse.ai_failed) {
      updateData.status = 'ESCALATED';
      updateData.needs_attention = true;
    } else if (aiResponse.status === 'CLOSED') {
      updateData.status = 'CLOSED';
    } else {
      updateData.status = 'WAITING_FOR_USER';
    }

    await supabase.from('tickets').update(updateData).eq('id', currentTicketId);

    return NextResponse.json({ reply: aiResponse.message_for_user, ticketId: currentTicketId, status: updateData.status });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}