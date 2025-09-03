// AuthPage.jsx
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  ActivityIndicator, Alert, Image, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../config/firebase';

export default function AuthPage() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [user, loading, error] = useAuthState(auth);

  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [role, setRole] = useState('player');

  const db = getFirestore();

  useEffect(() => {
    if (user) {
      navigation.replace('Drawer');
    }
  }, [user]);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      return Alert.alert('Error', 'Please fill all fields.');
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Login Failed', error.message);
    }
  };

  const handleRegister = async () => {
    if (!registerName || !registerEmail || !registerPassword) {
      return Alert.alert('Error', 'Please fill all fields.');
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      await updateProfile(userCredential.user, {
        displayName: registerName,
      });
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: registerName,
        email: registerEmail,
        role: role,
      });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, isDarkMode && { backgroundColor: '#121212' }]} keyboardShouldPersistTaps="handled">
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Image 
            source={require('../../assets/images/Logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>
      <Text style={[styles.title, isDarkMode && { color: '#fff' }]}>Welcome to Our App</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setMode('login')} style={[styles.tab, mode === 'login' && styles.activeTabBackground]}>
          <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('register')} style={[styles.tab, mode === 'register' && styles.activeTabBackground]}>
          <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>Register</Text>
        </TouchableOpacity>
      </View>

      {mode === 'login' ? (
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput placeholder="name@example.com" style={styles.input} value={loginEmail} onChangeText={setLoginEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Password</Text>
          <TextInput placeholder="••••••••" secureTextEntry style={styles.input} value={loginPassword} onChangeText={setLoginPassword} />
          <TouchableOpacity onPress={handleLogin} style={styles.button} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput placeholder="John Doe" style={styles.input} value={registerName} onChangeText={setRegisterName} />
          <Text style={styles.label}>Email</Text>
          <TextInput placeholder="name@example.com" style={styles.input} value={registerEmail} onChangeText={setRegisterEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Password</Text>
          <TextInput placeholder="••••••••" secureTextEntry style={styles.input} value={registerPassword} onChangeText={setRegisterPassword} />

          <Text style={styles.label}>Select Role</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity onPress={() => setRole('player')} style={[styles.roleOption, role === 'player' && styles.selectedRole]}>
              <Text style={styles.roleText}>Player</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRole('investor')} style={[styles.roleOption, role === 'investor' && styles.selectedRole]}>
              <Text style={styles.roleText}>Investor</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleRegister} style={styles.button} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create account</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: Platform.OS === 'web' ? 24 : 60,
    backgroundColor: '#fff',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
    maxWidth: Platform.OS === 'web' ? 500 : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
  },
  iconContainer: { alignItems: 'center', marginBottom: 16 },
  iconCircle: { 
    backgroundColor: '#e6f0ff', 
    padding: 12, 
    borderRadius: 999,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: { 
    width: 50, 
    height: 50 
  },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  tabContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24, backgroundColor: '#f0f0f0', borderRadius: 12 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTabBackground: { backgroundColor: '#e6f0ff' },
  tabText: { fontSize: 16, color: '#6c757d', fontWeight: '600' },
  activeTabText: { color: '#007bff' },
  label: { marginBottom: 6, fontWeight: '500', color: '#212529' },
  form: { marginBottom: 30 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#ced4da', fontSize: 16 },
  button: { backgroundColor: '#cce0ff', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#007bff', fontWeight: 'bold', fontSize: 16 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 12 },
  roleOption: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, alignItems: 'center' },
  selectedRole: { backgroundColor: '#e6f0ff', borderColor: '#007bff' },
  roleText: { fontSize: 14, fontWeight: '500' },
});
