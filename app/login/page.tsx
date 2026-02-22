import { login } from "./actions";
import Link from "next/link"; // Naprawa błędu

// Typowanie dla parametrów wyszukiwania (obsługa błędów z actions.ts)
interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans selection:bg-blue-100">
      {/* Główny kontener - zaokrąglenie 40px dla spójności */}
      <div className="max-w-md w-full bg-white p-10 md:p-14 rounded-[40px] shadow-2xl border border-slate-100 relative overflow-hidden">
        
        {/* Dekoracyjne tło błękitne (sky-400) */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

        <header className="mb-10 text-center relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">Panel IT</h1>
          <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em]">Autoryzacja Agenta</p>
        </header>

        {/* Formularz korzystający bezpośrednio z Server Action w actions.ts */}
        <form action={login} className="space-y-4 relative z-10">
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail służbowy</label>
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="agent@firma.pl" 
              // Klasy text-slate-900 font-bold zapewniają czarny tekst
              className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-300" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasło</label>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••" 
              className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-300" 
            />
          </div>

          {/* Wyświetlanie błędu przekazanego przez URL z actions.ts */}
          {error && (
            <div className="bg-red-50 text-red-600 text-[11px] font-bold p-4 rounded-2xl border border-red-100 animate-pulse">
              ⚠️ {decodeURIComponent(error)}
            </div>
          )}

          {/* Przycisk logowania - niebieski (blue-600) */}
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 mt-4 uppercase tracking-widest"
          >
            Zaloguj się 🔑
          </button>
        </form>

        <footer className="mt-10 text-center border-t border-slate-50 pt-8">
          <Link 
            href="/" 
            className="text-[10px] font-bold text-slate-300 hover:text-blue-600 uppercase tracking-widest transition-colors"
          >
            ← Powrót do strony zgłoszeń
          </Link>
        </footer>
      </div>
    </main>
  );
}