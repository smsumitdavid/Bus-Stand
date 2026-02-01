import { Platform } from 'react-native';

/**
 * ⚙️ Global Configuration
 * Contains API Keys and Platform-specific IDs
 */
export const CONFIG = {
  // 🤖 Gemini AI Key for intelligent features
  GEMINI_API_KEY: "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",
  
  // 📱 Expo Project ID for Updates/Builds
  EXPO_PROJECT_ID: "6f3f2f9e-ed44-4558-8eb0-eb757b5072ba",
  
  // 🔔 Push Notification Token
  EXPO_PUSH_TOKEN: "yE2iNndMmZZUHIigFBstdX7EmskG3Zy285KpZrHY",
};

/**
 * 📢 AdMob Configuration
 * Handles Android and iOS IDs separately for Banner Ads
 */
export const ADMOB_IDS = {
  // Application ID (Must be in app.json, but kept here for reference)
  appId: Platform.select({
    ios: 'ca-app-pub-6801510207917997~4471324247',
    android: 'ca-app-pub-6801510207917997~6362172176',
  }) || '',

  // Banner Ad Unit ID (Test IDs used if real ones fail, replace logic in production)
  banner: Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716', // Using Test ID for safety, replace with: ca-app-pub-3940256099942544/2934735716
    android: 'ca-app-pub-3940256099942544/6300978111', // Using Test ID for safety, replace with: ca-app-pub-3940256099942544/6300978111
  }) || '',
};
