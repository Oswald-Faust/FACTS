'use client';

import { useActionState } from 'react';
import { updateSettings, State } from './actions';
import { Save, Shield } from 'lucide-react';
import { IGlobalSettings } from '@/models/GlobalSettings';

const initialState: State = {
  message: null,
  success: false,
};

// Use Pick or Partial to avoid needing all mongoose document properties if they are not serializable or needed
type SettingsProps = {
    settings: {
        freeDailyLimit: number;
        premiumDailyLimit: number;
        isMaintenanceMode: boolean;
    }
}

export default function SettingsForm({ settings }: SettingsProps) {
  const [state, formAction] = useActionState(updateSettings, initialState);

  return (
    <form action={formAction} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-500" />
                Quotas & Limites
            </h2>
            <p className="text-sm text-slate-500 mt-1">Définissez les limites d&apos;utilisation pour les différents plans.</p>
        </div>
        
        <div className="p-6 space-y-6">
            {state?.message && (
                <div className={`p-4 rounded-lg text-sm ${state.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {state.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label htmlFor="freeDailyLimit" className="block text-sm font-medium text-slate-700">
                        Limite Gratuite (par jour)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            name="freeDailyLimit"
                            id="freeDailyLimit"
                            defaultValue={settings.freeDailyLimit}
                            className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm py-2.5 px-3 border"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-slate-400 text-xs">req/j</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500">Nombre de fact-checks autorisés pour les utilisateurs gratuits.</p>
                </div>

                <div className="space-y-3">
                    <label htmlFor="premiumDailyLimit" className="block text-sm font-medium text-slate-700">
                        Limite Premium (par jour)
                    </label>
                        <div className="relative">
                        <input
                            type="number"
                            name="premiumDailyLimit"
                            id="premiumDailyLimit"
                            defaultValue={settings.premiumDailyLimit}
                            className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm py-2.5 px-3 border"
                        />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-slate-400 text-xs text-right">0 = Illimité</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500">Mettre 0 pour illimité. Sinon, définit un plafond.</p>
                </div>
            </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Les changements sont appliqués immédiatement.</span>
            <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all active:scale-95"
            >
                <Save size={16} />
                Enregistrer les modifications
            </button>
        </div>
    </form>
  );
}
