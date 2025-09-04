import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

const ProfileScreen = () => {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/images/Logo.png')} style={styles.logo} />
        </View>

        {/* Title and Subtitle */}
        <Text style={styles.title}>Profile & Settings</Text>
        <Text style={styles.subtitle}>Alt Play</Text>
        <Text style={styles.tagline}>Manage Your Account</Text>

        {/* Profile Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Profile Features</Text>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>👤</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Personal Information</Text>
              <Text style={styles.featureDescription}>
                Update your personal details, contact information, and profile settings.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔒</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Privacy & Security</Text>
              <Text style={styles.featureDescription}>
                Manage your privacy settings, password, and account security preferences.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>⚙️</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Preferences</Text>
              <Text style={styles.featureDescription}>
                Customize your notification settings and platform preferences.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Keep your Alt Play profile updated and secure with our management tools.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 40 : 20,
    maxWidth: Platform.OS === 'web' ? 800 : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
  },
  logoContainer: {
    marginTop: Platform.OS === 'web' ? 40 : 20,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontSize: Platform.OS === 'web' ? 36 : 32,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? 52 : 45,
    fontWeight: 'bold',
    color: '#0984e3',
    marginBottom: 8,
  },
  tagline: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    color: '#636e72',
    fontStyle: 'italic',
    marginBottom: 30,
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 28 : 24,
    fontWeight: 'bold',
    color: '#2d3436',
    textAlign: 'center',
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
    marginTop: 4,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: '#636e72',
    lineHeight: Platform.OS === 'web' ? 24 : 20,
  },
  footer: {
    backgroundColor: '#0984e3',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  footerText: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 26 : 22,
  },
});

export default ProfileScreen;
