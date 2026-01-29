'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/db';
import { User } from '@/models/User';
import { FactCheck } from '@/models/FactCheck';

export async function deleteUser(userId: string) {
  try {
    await connectToDatabase();
    
    // Delete all fact checks associated with the user
    await FactCheck.deleteMany({ userId });
    
    // Delete the user
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }
    
    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Une erreur est survenue lors de la suppression de l\'utilisateur' };
  }
}
