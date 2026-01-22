import connectToDatabase from '@/lib/db';
import { FactCheck, VerdictType } from '@/models/FactCheck';

async function getFactChecks() {
  await connectToDatabase();
  const checks = await FactCheck.find()
    .sort({ createdAt: -1 })
    .populate('userId', 'displayName email photoUrl')
    .lean();
  return JSON.parse(JSON.stringify(checks));
}

const verdictColors: Record<string, string> = {
  'TRUE': 'bg-emerald-100 text-emerald-800',
  'FALSE': 'bg-red-100 text-red-800',
  'MISLEADING': 'bg-amber-100 text-amber-800',
  'NUANCED': 'bg-blue-100 text-blue-800',
  'AI_GENERATED': 'bg-purple-100 text-purple-800',
  'MANIPULATED': 'bg-orange-100 text-orange-800',
  'UNVERIFIED': 'bg-gray-100 text-gray-800',
};

export const dynamic = 'force-dynamic';

export default async function FactChecksPage() {
  const checks = await getFactChecks();

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-900">Analyses</h1>
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600">
                {checks.length} analyses total
            </div>
        </div>

        <div className="grid gap-6">
            {checks.map((check: any) => (
                <div key={check._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">{check.claim}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span>Par {check.userId?.displayName || check.userId?.email || 'Utilisateur supprimé'}</span>
                                <span>•</span>
                                <span>{new Date(check.createdAt).toLocaleDateString('fr-FR')} à {new Date(check.createdAt).toLocaleTimeString('fr-FR')}</span>
                            </div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${verdictColors[check.verdict] || 'bg-slate-100 text-slate-800'}`}>
                            {check.verdict}
                        </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg mb-4">
                        <p className="text-slate-700 text-sm leading-relaxed">{check.summary}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                            <span className="text-slate-500">
                                Confiance: <span className="font-medium text-slate-900">{check.confidenceScore}%</span>
                            </span>
                            <span className="text-slate-500">
                                Sources: <span className="font-medium text-slate-900">{check.sources?.length || 0}</span>
                            </span>
                        </div>
                        {check.imageUrl && (
                            <a href={check.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Voir l'image analysée
                            </a>
                        )}
                    </div>
                </div>
            ))}
            
            {checks.length === 0 && (
                <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
                    Aucune analyse trouvée.
                </div>
            )}
        </div>
    </div>
  );
}
