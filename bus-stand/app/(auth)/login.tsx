import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../src/services/firebaseConfig';
import { COLORS, SIZES, FONTS } from '../../src/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔹 Handle Login Logic
  const handleLogin = async () => {
    if (!email || !password) {
      // Platform Check for Alert
      if (Platform.OS === 'web') {
        window.alert('Error: Please fill in all fields');
      } else {
        Alert.alert('Error', 'Please fill in all fields');
      }
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // ✅ Success: Navigate to Driver Dashboard
      router.replace('/(tabs)/bus-details');
    } catch (error: any) {
      console.log("Login Error:", error.code); 

      // 🛑 ERROR MESSAGE LOGIC
      let errorMessage = "Something went wrong. Please try again.";

      if (
        error.code === 'auth/invalid-credential' || 
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/wrong-password'
      ) {
        errorMessage = "Wrong Email or Password entered.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid Email Format.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Try later.";
      } else {
        errorMessage = error.message; 
      }

      // 🛠️ FIX FOR WEB POPUP
      if (Platform.OS === 'web') {
        window.alert(errorMessage); // Browser wala Alert
      } else {
        Alert.alert('Login Failed', errorMessage); // Mobile App wala Alert
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              
        {/* 1️⃣ Header Section */}
        <View style={styles.header}>
          <Text style={styles.subHeader}>Welcome to bus stand</Text>
          <Text style={styles.mainHeader}>Your Route, Your Way</Text>
        </View>

        {/* 2️⃣ Login Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Login</Text>
          <Text style={styles.pageSubtitle}>Sign in to continue.</Text>
        </View>

        {/* 3️⃣ Image Section */}
        <View style={styles.imageContainer}>
          <Image 
            source={require('../../assets/images/login.png')} 
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* 4️⃣ Form Section */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Password Input */}
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Login Button */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Log in</Text>
            )}
          </TouchableOpacity>

          {/* Signup Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>No Account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.linkText}>Signup</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  mainHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
    height: 200, 
  },
  image: {
    width: '100%',
    height: '100%',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginBottom: 8,
    marginTop: 10,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#E0E0E0', 
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 10,
  },
  button: {
    backgroundColor: COLORS.primary, 
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  footerText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
