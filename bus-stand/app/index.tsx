import { Redirect } from 'expo-router';

/**
 * 🚀 App Entry Point
 * * Logic:
 * 1. Passengers do NOT need to login.
 * 2. We redirect immediately to the Main Tabs (Home Page).
 * 3. Authentication is only triggered if a user tries to access Driver features.
 */
const StartPage = () => {
  // ✅ Redirect straight to the Home Page (Tabs)
  return <Redirect href="/(tabs)" />;
};

export default StartPage;
