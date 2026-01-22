import connectToDatabase from '@/lib/db';
import { User } from '@/models/User';
import { FactCheck } from '@/models/FactCheck';
import { Users, FileText, Activity } from 'lucide-react';

async function getStats() {
  await connectToDatabase();
  const userCount = await User.countDocuments();
  const factCheckCount = await FactCheck.countDocuments();
  
  // Get recent activity
  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).lean();
  const recentChecks = await FactCheck.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'displayName email photoUrl').lean();

  return {
    userCount,
    factCheckCount,
    recentUsers: JSON.parse(JSON.stringify(recentUsers)),
    recentChecks: JSON.parse(JSON.stringify(recentChecks)),
  };
}

export const dynamic = 'force-dynamic';

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500 mt-2">Bienvenue sur le panneau d'administration de FACTS.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Utilisateurs inscrits</p>
            <p className="text-2xl font-bold text-slate-900">{stats.userCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Analyses effectuées</p>
            <p className="text-2xl font-bold text-slate-900">{stats.factCheckCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Activité aujourd'hui</p>
            <p className="text-2xl font-bold text-slate-900">-</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Derniers inscrits</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.recentUsers.length === 0 ? (
                <p className="text-slate-500 text-sm">Aucun utilisateur pour le moment.</p>
              ) : (
                stats.recentUsers.map((user: any) => (
                  <div key={user._id} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      {user.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.photoUrl} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <Users size={16} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{user.displayName || 'Utilisateur sans nom'}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="ml-auto text-xs text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Fact Checks */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Dernières analyses</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.recentChecks.length === 0 ? (
                <p className="text-slate-500 text-sm">Aucune analyse pour le moment.</p>
              ) : (
                stats.recentChecks.map((check: any) => (
                  <div key={check._id} className="flex gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      check.verdict === 'TRUE' ? 'bg-emerald-500' : 
                      check.verdict === 'FALSE' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{check.claim}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{check.summary}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                           check.verdict === 'TRUE' ? 'bg-emerald-50 text-emerald-700' : 
                           check.verdict === 'FALSE' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {check.verdict}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(check.createdAt).toLocaleDateString('fr-FR')} par {check.userId?.displayName || 'Anonyme'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
