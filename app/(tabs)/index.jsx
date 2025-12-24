// AuthPage.jsx
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  ActivityIndicator, Image, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
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
  const [loginEmailError, setLoginEmailError] = useState('');
  const [loginPasswordError, setLoginPasswordError] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [role, setRole] = useState('player');
  const [registerNameError, setRegisterNameError] = useState('');
  const [registerEmailError, setRegisterEmailError] = useState('');
  const [registerPasswordError, setRegisterPasswordError] = useState('');

  const db = getFirestore();

  // Validation functions
  const validateEmail = (email) => {
    if (!email) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password, isLogin = false) => {
    if (!password) {
      return 'Password is required';
    }
    if (!isLogin && password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (!isLogin && !/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase and one lowercase letter';
    }
    return '';
  };

  const validateName = (name) => {
    if (!name) {
      return 'Full name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters long';
    }
    if (name.trim().length > 50) {
      return 'Name must be less than 50 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return 'Name can only contain letters and spaces';
    }
    return '';
  };

  const showToast = (type, title, message) => {
    Toast.show({
      type: type,
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  };

  useEffect(() => {
    if (user) {
      navigation.replace('Drawer');
    }
  }, [user]);

  const handleLogin = async () => {
    // Clear previous errors
    setLoginEmailError('');
    setLoginPasswordError('');

    // Validate email
    const emailError = validateEmail(loginEmail);
    if (emailError) {
      setLoginEmailError(emailError);
      showToast('error', 'Validation Error', emailError);
      return;
    }

    // Validate password
    const passwordError = validatePassword(loginPassword, true);
    if (passwordError) {
      setLoginPasswordError(passwordError);
      showToast('error', 'Validation Error', passwordError);
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      setIsLoading(false);
      showToast('success', 'Success', 'Logged in successfully!');
    } catch (error) {
      setIsLoading(false);
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      showToast('error', 'Login Failed', errorMessage);
    }
  };

  const handleRegister = async () => {
    // Clear previous errors
    setRegisterNameError('');
    setRegisterEmailError('');
    setRegisterPasswordError('');

    // Validate name
    const nameError = validateName(registerName);
    if (nameError) {
      setRegisterNameError(nameError);
      showToast('error', 'Validation Error', nameError);
      return;
    }

    // Validate email
    const emailError = validateEmail(registerEmail);
    if (emailError) {
      setRegisterEmailError(emailError);
      showToast('error', 'Validation Error', emailError);
      return;
    }

    // Validate password
    const passwordError = validatePassword(registerPassword, false);
    if (passwordError) {
      setRegisterPasswordError(passwordError);
      showToast('error', 'Validation Error', passwordError);
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail.trim(), registerPassword);
      await updateProfile(userCredential.user, {
        displayName: registerName.trim(),
      });
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: registerName.trim(),
        email: registerEmail.trim(),
        role: role,
      });
      setIsLoading(false);
      showToast('success', 'Success', 'Account created successfully!');
    } catch (error) {
      setIsLoading(false);
      let errorMessage = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      showToast('error', 'Registration Failed', errorMessage);
    }
  };

  return (
    <>
      <ScrollView 
        contentContainerStyle={[styles.container, isDarkMode && styles.containerDark]} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={Platform.OS !== 'web'}
        style={styles.scrollView}
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
                style={[
                  styles.input, 
                  isDarkMode && styles.inputDark,
                  loginEmailError && styles.inputError
                ]} 
                value={loginEmail} 
                onChangeText={(text) => {
                  setLoginEmail(text);
                  if (loginEmailError) {
                    setLoginEmailError('');
                  }
                }} 
                keyboardType="email-address" 
                autoCapitalize="none"
                autoCorrect={false}
              />
              {loginEmailError ? (
                <Text style={styles.errorText}>{loginEmailError}</Text>
              ) : null}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Password</Text>
              <TextInput 
                placeholder="••••••••" 
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                secureTextEntry 
                style={[
                  styles.input, 
                  isDarkMode && styles.inputDark,
                  loginPasswordError && styles.inputError
                ]} 
                value={loginPassword} 
                onChangeText={(text) => {
                  setLoginPassword(text);
                  if (loginPasswordError) {
                    setLoginPasswordError('');
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {loginPasswordError ? (
                <Text style={styles.errorText}>{loginPasswordError}</Text>
              ) : null}
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
                style={[
                  styles.input, 
                  isDarkMode && styles.inputDark,
                  registerNameError && styles.inputError
                ]} 
                value={registerName} 
                onChangeText={(text) => {
                  setRegisterName(text);
                  if (registerNameError) {
                    setRegisterNameError('');
                  }
                }}
                autoCapitalize="words"
              />
              {registerNameError ? (
                <Text style={styles.errorText}>{registerNameError}</Text>
              ) : null}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Email</Text>
              <TextInput 
                placeholder="name@example.com" 
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                style={[
                  styles.input, 
                  isDarkMode && styles.inputDark,
                  registerEmailError && styles.inputError
                ]} 
                value={registerEmail} 
                onChangeText={(text) => {
                  setRegisterEmail(text);
                  if (registerEmailError) {
                    setRegisterEmailError('');
                  }
                }} 
                keyboardType="email-address" 
                autoCapitalize="none"
                autoCorrect={false}
              />
              {registerEmailError ? (
                <Text style={styles.errorText}>{registerEmailError}</Text>
              ) : null}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Password</Text>
              <TextInput 
                placeholder="••••••••" 
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                secureTextEntry 
                style={[
                  styles.input, 
                  isDarkMode && styles.inputDark,
                  registerPasswordError && styles.inputError
                ]} 
                value={registerPassword} 
                onChangeText={(text) => {
                  setRegisterPassword(text);
                  if (registerPasswordError) {
                    setRegisterPasswordError('');
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {registerPasswordError ? (
                <Text style={styles.errorText}>{registerPasswordError}</Text>
              ) : null}
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
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#f0f4f8',
    ...(Platform.OS === 'web' && {
      minHeight: '100vh',
      paddingVertical: 20,
      backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }),
    ...(Platform.OS !== 'web' && {
      minHeight: '100%',
    }),
  },
  containerDark: {
    backgroundColor: '#0a0e27',
  },
  contentWrapper: {
    padding: Platform.OS === 'web' ? 20 : 24,
    paddingTop: Platform.OS === 'web' ? 16 : 60,
    paddingBottom: Platform.OS === 'web' ? 24 : 24,
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    width: Platform.OS === 'web' ? '100%' : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
  },
  iconContainer: { 
    alignItems: 'center', 
    marginBottom: Platform.OS === 'web' ? 8 : 24,
  },
  iconCircle: { 
    backgroundColor: '#ffffff', 
    padding: Platform.OS === 'web' ? 10 : 16, 
    borderRadius: 28,
    width: Platform.OS === 'web' ? 72 : 100,
    height: Platform.OS === 'web' ? 72 : 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#e3f2fd',
  },
  iconCircleDark: {
    backgroundColor: '#1e3a5f',
    borderColor: '#2d4a6e',
    shadowColor: '#74b9ff',
  },
  logo: { 
    width: Platform.OS === 'web' ? 48 : 64, 
    height: Platform.OS === 'web' ? 48 : 64,
  },
  title: { 
    fontSize: Platform.OS === 'web' ? 28 : 36, 
    fontWeight: '800', 
    textAlign: 'center', 
    marginBottom: Platform.OS === 'web' ? 4 : 10,
    color: '#1a1a1a',
    letterSpacing: -0.8,
  },
  titleDark: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? 14 : 17,
    textAlign: 'center',
    marginBottom: Platform.OS === 'web' ? 16 : 36,
    color: '#636e72',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  subtitleDark: {
    color: '#d0d0d0',
  },
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#ffffff',
    marginBottom: Platform.OS === 'web' ? 16 : 36, 
    borderRadius: 18,
    padding: 6,
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e8f4fd',
  },
  tabContainerDark: {
    backgroundColor: '#1e1e1e',
    borderColor: '#2d2d2d',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    marginBottom: Platform.OS === 'web' ? 8 : 24,
  },
  inputGroup: {
    marginBottom: Platform.OS === 'web' ? 12 : 20,
  },
  label: { 
    marginBottom: Platform.OS === 'web' ? 5 : 8, 
    fontWeight: '600', 
    color: '#1a1a1a',
    fontSize: Platform.OS === 'web' ? 13 : 15,
  },
  labelDark: {
    color: '#e0e0e0',
  },
  input: { 
    backgroundColor: '#ffffff', 
    padding: Platform.OS === 'web' ? 12 : 18, 
    borderRadius: 14, 
    borderWidth: 2, 
    borderColor: '#e0e0e0', 
    fontSize: Platform.OS === 'web' ? 15 : 16,
    color: '#1a1a1a',
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  inputDark: {
    backgroundColor: '#1e1e1e',
    borderColor: '#3a3a3a',
    color: '#ffffff',
  },
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: Platform.OS === 'web' ? 12 : 13,
    marginTop: Platform.OS === 'web' ? 4 : 6,
    fontWeight: '500',
  },
  button: { 
    backgroundColor: '#0984e3', 
    padding: Platform.OS === 'web' ? 14 : 18, 
    borderRadius: 14, 
    alignItems: 'center',
    marginTop: Platform.OS === 'web' ? 4 : 12,
    marginBottom: Platform.OS === 'web' ? 8 : 0,
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
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
    padding: Platform.OS === 'web' ? 10 : 14, 
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
    borderWidth: 2.5,
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
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
