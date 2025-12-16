import React from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

const AboutScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/images/Logo.png')} style={styles.logo} />
        </View>

        {/* Title and Subtitle */}
        <Text style={styles.title}>Welcome to</Text>
        <Text style={styles.subtitle}>Alt Play</Text>
        <Text style={styles.tagline}>Where Talent Meets Investment</Text>

        {/* Main Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Alt Play is a revolutionary platform that connects talented players with investors who want to support their journey. 
            Whether you're a player looking for investment opportunities or an investor seeking promising talent, 
            Alt Play creates the perfect ecosystem for growth and success.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>👤</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>For Players</Text>
              <Text style={styles.featureDescription}>
                Create your profile, showcase your skills, and connect with investors who believe in your potential. 
                Get the support you need to reach your goals.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>💰</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>For Investors</Text>
              <Text style={styles.featureDescription}>
                Discover talented players, review their profiles, and invest in promising individuals. 
                Support the next generation of talent while building your investment portfolio.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🤝</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Mutual Growth</Text>
              <Text style={styles.featureDescription}>
                Build lasting relationships between players and investors. Track progress, 
                celebrate achievements, and grow together in the Alt Play community.
              </Text>
            </View>
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.sectionTitle}>Why Choose Alt Play?</Text>
          
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <Text style={styles.benefitText}>Targeted Matching</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📊</Text>
              <Text style={styles.benefitText}>Progress Tracking</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🔒</Text>
              <Text style={styles.benefitText}>Secure Platform</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🌐</Text>
              <Text style={styles.benefitText}>Cross-Platform</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Join thousands of players and investors who are already part of the Alt Play community.
          </Text>
          <Text style={styles.footerSubtext}>
            Start your journey today!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
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
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#0984e3',
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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
  descriptionContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    marginBottom: 30,
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e8f4fd',
  },
  description: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    color: '#2d3436',
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 28 : 24,
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
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e8f4fd',
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
  benefitsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  benefitItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: Platform.OS === 'web' ? '48%' : '48%',
    marginBottom: 16,
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e8f4fd',
  },
  benefitIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    fontWeight: '600',
    color: '#2d3436',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#0984e3',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  footerText: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: Platform.OS === 'web' ? 26 : 22,
  },
  footerSubtext: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: '#e3f2fd',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AboutScreen;
