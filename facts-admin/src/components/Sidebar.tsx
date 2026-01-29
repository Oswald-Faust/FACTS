'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, ShieldCheck } from 'lucide-react';


const Sidebar = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 text-white min-h-screen flex flex-col shadow-xl z-10">
      <div className="p-8 pb-8 flex flex-col gap-1">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
            FACTS
            </span>
        </div>
        <div className="pl-13 text-xs font-medium text-slate-400 uppercase tracking-widest pl-[3.25rem]">Admin</div>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1.5">
        <Link 
          href="/" 
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
            isActive('/') 
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20 font-medium' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
          }`}
        >
          <LayoutDashboard size={20} className={isActive('/') ? 'text-brand-100' : 'text-slate-500 group-hover:text-slate-300'} />
          <span>Tableau de bord</span>
        </Link>
        
        <Link 
          href="/users" 
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
            isActive('/users') || pathname?.startsWith('/users/')
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20 font-medium' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
          }`}
        >
          <Users size={20} className={isActive('/users') || pathname?.startsWith('/users/') ? 'text-brand-100' : 'text-slate-500 group-hover:text-slate-300'} />
          <span>Utilisateurs</span>
        </Link>
        
        <Link 
          href="/fact-checks" 
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
            isActive('/fact-checks') 
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20 font-medium' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
          }`}
        >
          <FileText size={20} className={isActive('/fact-checks') ? 'text-brand-100' : 'text-slate-500 group-hover:text-slate-300'} />
          <span>Analyses</span>
        </Link>
        
        <div className="pt-4 pb-2 px-4">
            <div className="h-px bg-slate-800/50"></div>
        </div>

        <Link 
          href="/settings" 
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
            isActive('/settings') 
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20 font-medium' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
          }`}
        >
          <Settings size={20} className={isActive('/settings') ? 'text-brand-100' : 'text-slate-500 group-hover:text-slate-300'} />
          <span>Paramètres</span>
        </Link>
      </nav>
      
      <div className="p-4 m-4 bg-slate-800/30 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3 px-2 py-1">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                <span className="text-xs font-bold text-white">AD</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Admin</p>
                <p className="text-xs text-slate-500 truncate">admin@finea.io</p>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
