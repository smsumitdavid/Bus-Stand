import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * 🎨 App Design System
 * Defined based on the provided UI screenshots and PDF requirements.
 */

export const COLORS = {
  // Main Brand Colors
  primary: '#000000',    // Black: Used for Bus Icons, Main Text, Buttons
  secondary: '#FFD700',  // Yellow: Used for Banner Ads, Highlighted Buttons (Gold/Yellow)
  
  // Backgrounds
  background: '#FFFFFF', // White: Main App Background
  surface: '#F8F9FA',    // Light Gray: Used for Cards/Input Backgrounds
  
  // Typography Colors
  text: '#000000',       // Primary Text
  textSecondary: '#808080', // Gray Text (Subtitles, Placeholders)
  
  // Status Colors (For Arrival Logic)
  success: '#008000',    // Green: On Time Arrival
  error: '#FF0000',      // Red: Late Arrival / Error
  warning: '#FFA500',    // Orange: Warning
  
  // Basics
  white: '#FFFFFF',
  black: '#000000',
  gray: '#808080',
  lightGray: '#E0E0E0',
  transparent: 'transparent',
};

export const SIZES = {
  // Global spacing
  base: 8,
  padding: 16,   // Standard padding for screens
  radius: 12,    // Border radius for Cards/Buttons
  
  // Icons
  iconSmall: 16,
  iconMedium: 24,
  iconLarge: 32,

  // Font Sizes
  largeTitle: 28,
  h1: 24,
  h2: 20,
  h3: 18,
  h4: 16,
  body1: 14,
  body2: 12,
  body3: 10, // Small text for distances etc.

  // Device Dimensions
  width,
  height,
};

export const FONTS = {
  // Font Weights can be customized here
  largeTitle: { fontSize: SIZES.largeTitle, fontWeight: 'bold' as 'bold' },
  h1: { fontSize: SIZES.h1, fontWeight: 'bold' as 'bold' },
  h2: { fontSize: SIZES.h2, fontWeight: 'bold' as 'bold' },
  h3: { fontSize: SIZES.h3, fontWeight: 'bold' as 'bold' },
  body1: { fontSize: SIZES.body1, fontWeight: 'normal' as 'normal' },
  body2: { fontSize: SIZES.body2, fontWeight: 'normal' as 'normal' },
  body3: { fontSize: SIZES.body3, fontWeight: 'normal' as 'normal' },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;
