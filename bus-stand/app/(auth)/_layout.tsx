
import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function AuthLayout() {
  return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <Stack
                    screenOptions={{
                              headerShown: false, // ❌ Hide Default Header
                                        animation: 'slide_from_bottom', // ✨ Smooth slide up animation
                                                  contentStyle: { backgroundColor: '#FFFFFF' },
                                                          }}
                                                                >
                                                                        <Stack.Screen name="login" />
                                                                                <Stack.Screen name="signup" />
                                                                                      </Stack>
                                                                                          </View>
                                                                                            );
                                                                                            }
                
                                                                            