// import Purchases, {
//   CustomerInfo,
//   PurchasesPackage,
// } from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEYS = {
  apple: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || 'apl_placeholder',
  google: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || 'goog_placeholder',
};

// Types mocks
export interface CustomerInfo {
    entitlements: {
        active: Record<string, any>;
        all: Record<string, any>;
    };
}

export interface PurchasesPackage {
    identifier: string;
    product: {
        title: string;
        priceString: string;
    }
}

class PurchaseService {
  private static instance: PurchaseService;
  private customerInfoListeners: ((info: CustomerInfo) => void)[] = [];

  private constructor() {}

  static getInstance(): PurchaseService {
    if (!PurchaseService.instance) {
      PurchaseService.instance = new PurchaseService();
    }
    return PurchaseService.instance;
  }

  private initialized = false;

  async init() {
    console.log('[Mock] Purchases init skipped');
    this.initialized = true;
  }

  async getOfferings(): Promise<PurchasesPackage[]> {
    console.log('[Mock] getOfferings');
    return [];
  }

  async purchasePackage(pack: PurchasesPackage): Promise<CustomerInfo | undefined> {
     console.log('[Mock] purchasePackage');
     return undefined;
  }

  async restorePurchases(): Promise<CustomerInfo | undefined> {
    console.log('[Mock] restorePurchases');
    return undefined;
  }

  addCustomerInfoUpdateListener(listener: (info: CustomerInfo) => void) {
      this.customerInfoListeners.push(listener);
      return () => {
          this.customerInfoListeners = this.customerInfoListeners.filter(l => l !== listener);
      };
  }
}

export default PurchaseService.getInstance();
