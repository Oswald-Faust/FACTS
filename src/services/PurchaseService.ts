import Purchases, {
  CustomerInfo,
  PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEYS = {
  apple: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || 'apl_placeholder',
  google: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || 'goog_placeholder',
};

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

  async init() {
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: API_KEYS.apple });
    } else if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: API_KEYS.google });
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      // Handle restoring or checking initial state here if needed
    } catch (e) {
      console.log('Error initializing RevenueCat', e);
    }
    
    Purchases.addCustomerInfoUpdateListener((info) => {
        this.customerInfoListeners.forEach(listener => listener(info));
    });
  }

  async getOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        return offerings.current.availablePackages;
      }
    } catch (e) {
      console.log('Error fetching offerings', e);
    }
    return [];
  }

  async purchasePackage(pack: PurchasesPackage) {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);
      return customerInfo;
    } catch (e: any) {
      if (!e.userCancelled) {
        throw new Error(e.message);
      }
    }
  }

  async restorePurchases() {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (e) {
        console.log('Error restoring purchases', e);
        throw e;
    }
  }

  addCustomerInfoUpdateListener(listener: (info: CustomerInfo) => void) {
      this.customerInfoListeners.push(listener);
      return () => {
          this.customerInfoListeners = this.customerInfoListeners.filter(l => l !== listener);
      };
  }
}

export default PurchaseService.getInstance();
