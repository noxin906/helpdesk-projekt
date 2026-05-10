import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Dostosuj ścieżkę do swojego klienta

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const systemInstruction = `Jesteś asystentem IT Helpdesk zintegrowanym w firmowym systemie biletowym.
Użytkownik wypełnił już formularz zgłoszeniowy, a Ty prowadzisz z nim diagnozę w dedykowanym, jednorazowym oknie czatu.

BARDZO WAŻNE ZASADY ZACHOWANIA:
1. Jesteś formalny, profesjonalny i zwięzły. Używasz formatowania Markdown (pogrubienia, wypunktowania) do pisania instrukcji.
2. Rozmowa dotyczy TYLKO bieżącego problemu technicznego.
3. ŚWIADOMOŚĆ KONTEKSTU: Ten czat zostanie bezpowrotnie zamknięty, gdy problem zostanie rozwiązany. 
4. ZAKOŃCZENIE: Jeśli ustawiasz status "CLOSED" (bo użytkownik potwierdził rozwiązanie), pożegnaj się krótko (np. "Cieszę się, że mogłem pomóc. Zgłoszenie zostaje zamknięte. Życzę miłego dnia!"). POD ŻADNYM POZOREM nie proponuj dalszego kontaktu w tym oknie ("pisz śmiało tutaj"), bo będzie to technicznie niemożliwe.

Zawsze odpowiadaj w formacie JSON:
{
  "message_for_user": "Sformatowany tekst w Markdown",
  "status": "WAITING_FOR_USER" | "CLOSED" | "ESCALATED",
  "ai_failed": true/false,
  "summary": "Krótki opis dla technika"
}`;

export async function POST(req: Request) {
  try {
    const { message, ticketId, userEmail } = await req.json();

    let currentTicketId = ticketId;

    // 1. Jeśli nie mamy ticketId, tworzymy nowy ticket (Status: AI_OPERATED)
    if (!currentTicketId) {
      const { data: newTicket, error: createError } = await supabase
        .from('tickets')
        .insert({
          subject: 'Nowe zgłoszenie (analiza AI...)',
          customer_email: userEmail,
          status: 'AI_OPERATED',
          description: message
        })
        .select()
        .single();

      if (createError) throw createError;
      currentTicketId = newTicket.id;
    }

    // 2. Wywołujemy Gemini
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite",
      systemInstruction: systemInstruction,
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(message);
    const aiResponse = JSON.parse(result.response.text());

    // 3. Logika aktualizacji bazy zgodnie z Twoimi wymaganiami
    const updateData: any = {
      ai_notes: aiResponse.summary,
    };

    // Jeśli bot zadał pytanie -> WAITING_FOR_USER
    if (aiResponse.status === 'WAITING_FOR_USER') {
      updateData.status = 'WAITING_FOR_USER';
    } 
    
    // Jeśli użytkownik wcześniej powiedział "nie działa", a bot to wyłapał (ai_failed)
    // to zapalamy flagę "needs_attention" dla technika
    if (aiResponse.ai_failed) {
      updateData.needs_attention = true;
    }

    // Jeśli bot uznał, że problem rozwiązany
    if (aiResponse.status === 'CLOSED') {
      updateData.status = 'CLOSED';
    }

    await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', currentTicketId);

    // 4. Zwracamy odpowiedź do frontendu
    return NextResponse.json({
      reply: aiResponse.message_for_user,
      ticketId: currentTicketId,
      status: updateData.status
    });

  } catch (error) {
    console.error("Błąd Backend:", error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}