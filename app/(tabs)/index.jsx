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
    <ScrollView 
      contentContainerStyle={[styles.container, isDarkMode && styles.containerDark]} 
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.contentWrapper}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, isDarkMode && styles.iconCircleDark]}>
            <Image 
              source={require('../../assets/images/Logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>
        
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Welcome to AltPlay</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          {mode === 'login' ? 'Sign in to continue' : 'Create your account to get started'}
        </Text>

        <View style={[styles.tabContainer, isDarkMode && styles.tabContainerDark]}>
          <TouchableOpacity 
            onPress={() => setMode('login')} 
            style={[styles.tab, mode === 'login' && [styles.activeTab, isDarkMode && styles.activeTabDark]]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setMode('register')} 
            style={[styles.tab, mode === 'register' && [styles.activeTab, isDarkMode && styles.activeTabDark]]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>Register</Text>
          </TouchableOpacity>
        </View>

        {mode === 'login' ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Email</Text>
              <TextInput 
                placeholder="name@example.com" 
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                style={[styles.input, isDarkMode && styles.inputDark]} 
                value={loginEmail} 
                onChangeText={setLoginEmail} 
                keyboardType="email-address" 
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Password</Text>
              <TextInput 
                placeholder="••••••••" 
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                secureTextEntry 
                style={[styles.input, isDarkMode && styles.inputDark]} 
                value={loginPassword} 
                onChangeText={setLoginPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <TouchableOpacity 
              onPress={handleLogin} 
              style={[styles.button, isDarkMode && styles.buttonDark, isLoading && styles.buttonDisabled]} 
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Full Name</Text>
              <TextInput 
                placeholder="John Doe" 
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                style={[styles.input, isDarkMode && styles.inputDark]} 
                value={registerName} 
                onChangeText={setRegisterName}
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Email</Text>
              <TextInput 
                placeholder="name@example.com" 
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                style={[styles.input, isDarkMode && styles.inputDark]} 
                value={registerEmail} 
                onChangeText={setRegisterEmail} 
                keyboardType="email-address" 
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Password</Text>
              <TextInput 
                placeholder="••••••••" 
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                secureTextEntry 
                style={[styles.input, isDarkMode && styles.inputDark]} 
                value={registerPassword} 
                onChangeText={setRegisterPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Select Role</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity 
                  onPress={() => setRole('player')} 
                  style={[
                    styles.roleOption, 
                    role === 'player' && [styles.selectedRole, isDarkMode && styles.selectedRoleDark],
                    isDarkMode && styles.roleOptionDark
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.roleText, role === 'player' && styles.selectedRoleText, isDarkMode && role !== 'player' && styles.roleTextDark]}>
                    Player
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setRole('investor')} 
                  style={[
                    styles.roleOption, 
                    role === 'investor' && [styles.selectedRole, isDarkMode && styles.selectedRoleDark],
                    isDarkMode && styles.roleOptionDark
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.roleText, role === 'investor' && styles.selectedRoleText, isDarkMode && role !== 'investor' && styles.roleTextDark]}>
                    Investor
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleRegister} 
              style={[styles.button, isDarkMode && styles.buttonDark, isLoading && styles.buttonDisabled]} 
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
    ...(Platform.OS === 'web' && {
      justifyContent: 'center',
    }),
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  contentWrapper: {
    padding: Platform.OS === 'web' ? 24 : 24,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: Platform.OS === 'web' ? 20 : 24,
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    width: Platform.OS === 'web' ? '100%' : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
  },
  iconContainer: { 
    alignItems: 'center', 
    marginBottom: Platform.OS === 'web' ? 12 : 24,
  },
  iconCircle: { 
    backgroundColor: '#e3f2fd', 
    padding: Platform.OS === 'web' ? 12 : 16, 
    borderRadius: 24,
    width: Platform.OS === 'web' ? 72 : 96,
    height: Platform.OS === 'web' ? 72 : 96,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircleDark: {
    backgroundColor: '#1e3a5f',
    shadowColor: '#0984e3',
  },
  logo: { 
    width: Platform.OS === 'web' ? 48 : 64, 
    height: Platform.OS === 'web' ? 48 : 64,
  },
  title: { 
    fontSize: Platform.OS === 'web' ? 28 : 32, 
    fontWeight: '700', 
    textAlign: 'center', 
    marginBottom: Platform.OS === 'web' ? 4 : 8,
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  titleDark: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? 14 : 16,
    textAlign: 'center',
    marginBottom: Platform.OS === 'web' ? 20 : 32,
    color: '#666',
    fontWeight: '400',
  },
  subtitleDark: {
    color: '#b0b0b0',
  },
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#ffffff',
    marginBottom: Platform.OS === 'web' ? 20 : 32, 
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tabContainerDark: {
    backgroundColor: '#1e1e1e',
  },
  tab: { 
    flex: 1, 
    paddingVertical: Platform.OS === 'web' ? 12 : 14, 
    alignItems: 'center', 
    borderRadius: 12,
    transition: 'all 0.2s',
  },
  activeTab: { 
    backgroundColor: '#0984e3',
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  activeTabDark: {
    backgroundColor: '#0984e3',
  },
  tabText: { 
    fontSize: 16, 
    color: '#666', 
    fontWeight: '600',
  },
  activeTabText: { 
    color: '#ffffff',
    fontWeight: '700',
  },
  form: { 
    marginBottom: Platform.OS === 'web' ? 16 : 24,
  },
  inputGroup: {
    marginBottom: Platform.OS === 'web' ? 14 : 20,
  },
  label: { 
    marginBottom: Platform.OS === 'web' ? 6 : 8, 
    fontWeight: '600', 
    color: '#1a1a1a',
    fontSize: Platform.OS === 'web' ? 14 : 15,
  },
  labelDark: {
    color: '#e0e0e0',
  },
  input: { 
    backgroundColor: '#ffffff', 
    padding: Platform.OS === 'web' ? 12 : 16, 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderColor: '#e0e0e0', 
    fontSize: Platform.OS === 'web' ? 15 : 16,
    color: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputDark: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
    color: '#ffffff',
  },
  button: { 
    backgroundColor: '#0984e3', 
    padding: Platform.OS === 'web' ? 14 : 16, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: Platform.OS === 'web' ? 4 : 8,
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDark: {
    backgroundColor: '#0984e3',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { 
    color: '#ffffff', 
    fontWeight: '700', 
    fontSize: Platform.OS === 'web' ? 16 : 17,
    letterSpacing: 0.3,
  },
  roleContainer: { 
    flexDirection: 'row', 
    gap: 12,
    marginTop: Platform.OS === 'web' ? 2 : 4,
  },
  roleOption: { 
    flex: 1, 
    padding: Platform.OS === 'web' ? 12 : 14, 
    borderWidth: 1.5, 
    borderColor: '#e0e0e0', 
    borderRadius: 12, 
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  roleOptionDark: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
  },
  selectedRole: { 
    backgroundColor: '#e3f2fd', 
    borderColor: '#0984e3',
    borderWidth: 2,
  },
  selectedRoleDark: {
    backgroundColor: '#1e3a5f',
    borderColor: '#0984e3',
  },
  roleText: { 
    fontSize: Platform.OS === 'web' ? 14 : 15, 
    fontWeight: '600',
    color: '#666',
  },
  roleTextDark: {
    color: '#b0b0b0',
  },
  selectedRoleText: {
    color: '#0984e3',
    fontWeight: '700',
  },
});
