import Link from 'next/link';
import { LayoutDashboard, Users, FileText, Settings, ShieldCheck } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-800 flex items-center gap-2">
        <ShieldCheck className="h-8 w-8 text-blue-500" />
        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          FACTS Admin
        </span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <Link 
          href="/" 
          className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        
        <Link 
          href="/users" 
          className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          <Users size={20} />
          <span>Utilisateurs</span>
        </Link>
        
        <Link 
          href="/fact-checks" 
          className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          <FileText size={20} />
          <span>Analyses</span>
        </Link>
        
        <Link 
          href="/settings" 
          className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          <Settings size={20} />
          <span>Paramètres</span>
        </Link>
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 text-slate-400 text-sm">
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
