import connectToDatabase from '@/lib/db';
import { User } from '@/models/User';
import { Users as UsersIcon, Eye } from 'lucide-react';
import Link from 'next/link';

async function getUsers() {
  await connectToDatabase();
  const users = await User.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(users));
}

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-900">Utilisateurs</h1>
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600">
                {users.length} utilisateurs total
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Utilisateur</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Inscription</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Provider</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Analyses</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Statut</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {users.map((user: any) => (
                            <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden">
                                            {user.photoUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={user.photoUrl} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <UsersIcon size={16} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{user.displayName || 'Sans nom'}</p>
                                            <p className="text-slate-500 text-xs">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                                        {user.provider}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {user.factChecksCount || 0}
                                </td>
                                <td className="px-6 py-4">
                                    {user.isPremium ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                            Premium
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                            Gratuit
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link 
                                        href={`/users/${user._id}`}
                                        className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="Voir les détails"
                                    >
                                        <Eye size={20} />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    Aucun utilisateur trouvé.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}
