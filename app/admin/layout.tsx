"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0'); .material-symbols-outlined { vertical-align: middle; }`}} />

      <aside className="fixed left-0 top-0 h-full w-60 bg-slate-900 flex flex-col py-6 gap-2 z-50 shadow-xl">
        <div className="px-6 mb-6">
          <h1 className="text-lg font-bold text-white tracking-tight">Portal Technika</h1>
        </div>
        
        <nav className="flex-grow space-y-2 px-2">
          <Link href="/admin" className={`flex items-center px-4 py-3 rounded-xl transition-all ${pathname === '/admin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <span className="material-symbols-outlined mr-3">dashboard</span>
            <span className="text-sm font-semibold">Pulpit główny</span>
          </Link>
          
          <Link href="/admin/tickets/new" className={`flex items-center px-4 py-3 rounded-xl transition-all ${pathname === '/admin/tickets/new' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <span className="material-symbols-outlined mr-3">add_circle</span>
            <span className="text-sm font-semibold">Zgłoszenie wewnętrzne</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={() => router.push("/")} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl text-sm font-bold transition-colors">
            <span className="material-symbols-outlined text-[18px]">logout</span> Wyloguj się
          </button>
        </div>
      </aside>

      <div className="ml-60 flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}