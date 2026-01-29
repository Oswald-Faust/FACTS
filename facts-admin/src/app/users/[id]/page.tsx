import connectToDatabase from '@/lib/db';
import { User } from '@/models/User';
import DeleteUserButton from './DeleteUserButton';
import { ArrowLeft, Calendar, Shield, Mail, Activity, Fingerprint } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getUser(id: string) {
    try {
        await connectToDatabase();
        if (!id.match(/^[0-9a-fA-F]{24}$/)) return null;
        
        const user = await User.findById(id).lean();
        if (!user) return null;
        
        return JSON.parse(JSON.stringify(user));
    } catch {
        return null;
    }
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getUser(id);

    if (!user) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4">
                <Link 
                    href="/users" 
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">Détails de l&apos;utilisateur</h1>
            </div>

            {/* Main Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 w-full relative"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="h-24 w-24 rounded-2xl ring-4 ring-white bg-white overflow-hidden shadow-md flex items-center justify-center">
                            {user.photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-3xl font-bold text-indigo-600">
                                    {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <DeleteUserButton userId={user._id} />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-1">{user.displayName || 'Utilisateur sans nom'}</h2>
                        <div className="flex items-center gap-2 text-slate-500 mb-6">
                            <Mail size={16} />
                            <span>{user.email}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Stat 1 */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                                    <Activity size={16} className="text-blue-500" />
                                    Analyses réalisées
                                </p>
                                <p className="text-2xl font-bold text-slate-900">{user.factChecksCount || 0}</p>
                            </div>
                            
                            {/* Stat 2 */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                                    <Shield size={16} className={user.isPremium ? "text-amber-500" : "text-slate-400"} />
                                    Statut
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className={`text-lg font-bold ${user.isPremium ? 'text-amber-600' : 'text-slate-700'}`}>
                                        {user.isPremium ? 'Premium' : 'Standard'}
                                    </span>
                                    {user.isPremium && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">Actif</span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Stat 3 */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                                    <Fingerprint size={16} className="text-purple-500" />
                                    Auth Provider
                                </p>
                                <p className="text-lg font-bold text-slate-900 capitalize">{user.provider || 'Email'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Meta Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        <Calendar className="text-slate-400" size={20} />
                        Dates importantes
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-slate-500">Date d&apos;inscription</span>
                            <span className="font-medium text-slate-900">
                                {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-slate-500">Dernière modification</span>
                            <span className="font-medium text-slate-900">
                                {new Date(user.updatedAt).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                        {user.isPremium && user.premiumExpiresAt && (
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-slate-500">Expiration Premium</span>
                                <span className="font-medium text-amber-700">
                                    {new Date(user.premiumExpiresAt).toLocaleDateString('fr-FR')}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-slate-500">Dernière connexion</span>
                            <span className="font-medium text-slate-900">
                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) : 'Jamais'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Informations techniques</h3>
                    <div className="space-y-3 font-mono text-sm">
                        <div className="flex flex-col gap-1">
                            <span className="text-slate-500 text-xs uppercase tracking-wider">User ID</span>
                            <span className="bg-slate-50 p-2 rounded border border-slate-100 text-slate-700 select-all">
                                {user._id}
                            </span>
                        </div>
                        {user.providerId && (
                            <div className="flex flex-col gap-1">
                                <span className="text-slate-500 text-xs uppercase tracking-wider">Provider ID</span>
                                <span className="bg-slate-50 p-2 rounded border border-slate-100 text-slate-700 truncate select-all">
                                    {user.providerId}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
