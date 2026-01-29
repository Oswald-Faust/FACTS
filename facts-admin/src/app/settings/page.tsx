import connectToDatabase from '@/lib/db';
import { GlobalSettings } from '@/models/GlobalSettings';
import { Settings, AlertTriangle } from 'lucide-react';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

async function getSettings() {
  await connectToDatabase();
  const settings = await GlobalSettings.findOne().lean();
  
  if (!settings) {
    // If no settings exist yet, return defaults (or create them)
    return {
      freeDailyLimit: 10,
      premiumDailyLimit: 0,
      isMaintenanceMode: false
    };
  }
  
  return JSON.parse(JSON.stringify(settings));
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-brand-600">
            <Settings size={24} />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Paramètres</h1>
            <p className="text-slate-500">Gérez les configurations globales de l&apos;application</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <SettingsForm settings={settings} />

             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden opacity-75 grayscale hover:grayscale-0 transition-all">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Maintenance & Système
                    </h2>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900">Mode Maintenance</p>
                            <p className="text-sm text-slate-500">Empêche l&apos;accès à l&apos;application pour tous les utilisateurs non-admins.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-not-allowed">
                            <input type="checkbox" className="sr-only peer" disabled checked={settings.isMaintenanceMode} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                    </div>
                     <p className="text-xs text-amber-600 mt-4 bg-amber-50 p-2 rounded border border-amber-100">Cette fonctionnalité n&apos;est pas encore active dans le backend.</p>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white shadow-lg">
                <h3 className="font-bold text-lg mb-2">Information</h3>
                <p className="text-brand-100 text-sm mb-4">
                    Ces paramètres affectent directement l&apos;API Backend. Une modification du quota gratuit prend effet immédiatement pour tous les utilisateurs non-premium.
                </p>
                <div className="text-xs font-mono bg-black/20 rounded p-2">
                    GlobalSettings v1.0
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
