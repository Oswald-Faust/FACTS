'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteUser } from '../actions';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';

interface DeleteUserButtonProps {
  userId: string;
}

export default function DeleteUserButton({ userId }: DeleteUserButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        const result = await deleteUser(userId);
        if (result.success) {
            router.push('/users');
            router.refresh();
        } else {
            alert(result.error);
            setIsDeleting(false);
        }
    } catch {
        alert('Une erreur est survenue');
        setIsDeleting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            </div>
            
            <p className="text-slate-600 mb-6">
                Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible et supprimera également toutes ses analyses.
            </p>

            <div className="flex justify-end gap-3">
                <button 
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                    Annuler
                </button>
                <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                    {isDeleting ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Suppression...
                        </>
                    ) : (
                        <>
                            <Trash2 size={18} />
                            Supprimer définitivement
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <button 
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg font-medium transition-colors shadow-sm"
    >
        <Trash2 size={18} />
        Supprimer l&apos;utilisateur
    </button>
  );
}
