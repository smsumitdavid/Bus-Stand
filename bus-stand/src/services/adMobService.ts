import { Platform } from 'react-native';
import { ADMOB_IDS } from '../constants/config';

// ⚠️ Note: In a managed Expo workflow without a custom dev client, 
// AdMob might behave differently or require a build to test.
// We structure this service to easily swap implementation if needed.

export const AdMobService = {
  /**
   * Returns the correct Ad Unit ID based on platform
   */
  getBannerAdUnitId: (): string => {
    // In development (Expo Go), it is safer to use Test IDs to avoid policy violations
    // Standard Google Test ID for Banner
    const testBannerId = Platform.select({
      ios: 'ca-app-pub-3940256099942544/2934735716',
      android: 'ca-app-pub-3940256099942544/6300978111',
    });

    // If you are using a production build (EAS Build), use your real ID
    if (!__DEV__) {
      return ADMOB_IDS.banner || testBannerId!;
    }
    
    return testBannerId!;
  },

  /**
   * Helper to determine if we should show ads
   * (Can be extended to check for Premium Subscription later)
   */
  shouldShowAds: (): boolean => {
    return true; // Currently always true
  }
};
