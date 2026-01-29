'use server';

import connectToDatabase from '@/lib/db';
import { GlobalSettings } from '@/models/GlobalSettings';
import { revalidatePath } from 'next/cache';

export type State = {
    message?: string | null;
    success?: boolean;
}

export async function updateSettings(prevState: State | null, formData: FormData): Promise<State> {
  try {
    await connectToDatabase();

    const freeDailyLimit = parseInt(formData.get('freeDailyLimit') as string);
    const premiumDailyLimit = parseInt(formData.get('premiumDailyLimit') as string);
    const isMaintenanceMode = formData.get('isMaintenanceMode') === 'on';

    await GlobalSettings.findOneAndUpdate(
      {},
      {
        $set: {
            freeDailyLimit: isNaN(freeDailyLimit) ? 10 : freeDailyLimit,
            premiumDailyLimit: isNaN(premiumDailyLimit) ? 0 : premiumDailyLimit,
            isMaintenanceMode,
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    revalidatePath('/settings');
    return { success: true, message: 'Paramètres mis à jour avec succès' };
  } catch (error) {
    console.error('Failed to update settings:', error);
    return { success: false, message: 'Erreur lors de la mise à jour des paramètres' };
  }
}
