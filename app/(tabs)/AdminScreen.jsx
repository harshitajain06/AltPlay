import { useNavigation } from '@react-navigation/native';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../config/firebase';

const AdminScreen = () => {
  const navigation = useNavigation();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'investments'

  useEffect(() => {
    fetchInvestmentData();
  }, []);

  const fetchInvestmentData = async () => {
    try {
      setLoading(true);
      
      // Fetch all investments
      const investmentsQuery = query(
        collection(db, "investments")
        // Note: Removed orderBy temporarily to avoid potential issues with missing investedAt field
      );
      const investmentsSnapshot = await getDocs(investmentsQuery);
      
      console.log("Number of investments found:", investmentsSnapshot.docs.length);
      
      const investmentData = await Promise.all(
        investmentsSnapshot.docs.map(async (docSnapshot) => {
          const data = { id: docSnapshot.id, ...docSnapshot.data() };
          
          // Get investor details
          try {
            if (data.investorId) {
              const investorDoc = await getDoc(doc(db, "users", data.investorId));
              if (investorDoc.exists()) {
                data.investor = investorDoc.data();
              } else {
                data.investor = { name: "Unknown Investor", email: "N/A" };
              }
            } else {
              data.investor = { name: "Unknown Investor", email: "N/A" };
            }
          } catch (error) {
            console.error("Error fetching investor:", error);
            data.investor = { name: "Unknown Investor", email: "N/A" };
          }
          
          // Get player details
          try {
            if (data.playerId) {
              const playerDoc = await getDoc(doc(db, "players", data.playerId));
              if (playerDoc.exists()) {
                data.player = { id: playerDoc.id, ...playerDoc.data() };
              } else {
                data.player = { fullName: "Unknown Player", email: "N/A" };
              }
            } else {
              data.player = { fullName: "Unknown Player", email: "N/A" };
            }
          } catch (error) {
            console.error("Error fetching player:", error);
            data.player = { fullName: "Unknown Player", email: "N/A" };
          }
          
          return data;
        })
      );
      
      setInvestments(investmentData);
    } catch (error) {
      console.error("Error fetching investment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderInvestmentItem = ({ item }) => (
    <View style={styles.investmentCard}>
      {/* Card Header with Gradient */}
      <View style={styles.investmentHeader}>
        <View style={styles.investmentTitleContainer}>
          <Text style={styles.investmentIcon}>💰</Text>
          <Text style={styles.investmentTitle}>Investment</Text>
        </View>
        <View style={styles.investmentDateContainer}>
          <Text style={styles.investmentDate}>
            {item.investedAt?.toDate()?.toLocaleDateString() || "Unknown Date"}
          </Text>
        </View>
      </View>
      
      <View style={styles.investmentContent}>
        {/* Investor Section */}
        <View style={styles.investorSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👤</Text>
            <Text style={styles.sectionTitle}>Investor</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>
                {item.investor?.name || "Unknown"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>
                {item.investor?.email || "N/A"}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Player Section */}
        <View style={styles.playerSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚽</Text>
            <Text style={styles.sectionTitle}>Player</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>
                {item.player?.fullName || "Unknown"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Position</Text>
              <Text style={styles.infoValue}>
                {item.player?.primaryPosition || "N/A"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Club</Text>
              <Text style={styles.infoValue}>
                {item.player?.currentClub || "Free Agent"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>
                {item.player?.email || "N/A"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>
                {item.player?.phone || "N/A"}
              </Text>
            </View>
            <View style={[styles.infoItem, styles.upiItem]}>
              <Text style={styles.infoLabel}>💳 UPI Link</Text>
              {item.player?.upiLink ? (
                <TouchableOpacity 
                  onPress={() => {
                    if (item.player.upiLink.startsWith('http')) {
                      // Open in browser for web, or use Linking for mobile
                      if (Platform.OS === 'web') {
                        window.open(item.player.upiLink, '_blank');
                      }
                    }
                  }}
                  style={styles.upiButton}
                >
                  <Text style={[styles.infoValue, styles.upiLink]}>
                    {item.player.upiLink} 🔗
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.infoValue, styles.upiLink, styles.noUpiLink]}>
                  Not provided ❌
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0984e3" />
        <Text style={styles.loadingText}>Loading investment data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* Header with Gradient Background */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/images/Logo.png')} style={styles.logo} />
          </View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Alt Play</Text>
          <Text style={styles.tagline}>Platform Management</Text>
        </View>

        {/* Modern Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={styles.tabIcon}>📊</Text>
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'investments' && styles.activeTab]}
            onPress={() => setActiveTab('investments')}
          >
            <Text style={styles.tabIcon}>💰</Text>
            <Text style={[styles.tabText, activeTab === 'investments' && styles.activeTabText]}>
              Investments
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{investments.length}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {activeTab === 'overview' ? (
          <View style={styles.featuresContainer}>
            <Text style={styles.sectionTitle}>Admin Features</Text>
            
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>👥</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>User Management</Text>
                <Text style={styles.featureDescription}>
                  Manage players and investors, view user profiles, and monitor platform activity.
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📊</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Analytics & Reports</Text>
                <Text style={styles.featureDescription}>
                  Track platform metrics, investment trends, and user engagement statistics.
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>⚙️</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Platform Settings</Text>
                <Text style={styles.featureDescription}>
                  Configure platform settings, manage content, and control user access.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.investmentsContainer}>
            <Text style={styles.sectionTitle}>Investment Tracking</Text>
            <Text style={styles.sectionSubtitle}>
              Monitor all investor-player relationships and investment activities
            </Text>
            
            {/* Investment Statistics */}
            {investments.length > 0 && (
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{investments.length}</Text>
                  <Text style={styles.statLabel}>Total Investments</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {new Set(investments.map(inv => inv.investorId)).size}
                  </Text>
                  <Text style={styles.statLabel}>Unique Investors</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {new Set(investments.map(inv => inv.playerId)).size}
                  </Text>
                  <Text style={styles.statLabel}>Players Invested</Text>
                </View>
              </View>
            )}
            
            {investments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📈</Text>
                <Text style={styles.emptyTitle}>No Investments Yet</Text>
                <Text style={styles.emptyDescription}>
                  Investment data will appear here once investors start investing in players.
                </Text>
              </View>
            ) : (
              <FlatList
                data={investments}
                keyExtractor={(item) => item.id}
                renderItem={renderInvestmentItem}
                contentContainerStyle={styles.investmentsList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Manage and monitor the Alt Play platform with comprehensive admin tools.
        </Text>
      </View>
    </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 40 : 20,
    maxWidth: Platform.OS === 'web' ? 900 : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#667eea',
    borderRadius: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  logoContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  title: {
    fontSize: Platform.OS === 'web' ? 32 : 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? 24 : 20,
    color: '#e8f4fd',
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  tagline: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: '#cbd5e0',
    textAlign: 'center',
    marginBottom: 0,
    fontStyle: 'italic',
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
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  featureIcon: {
    fontSize: 36,
    marginRight: 20,
    marginTop: 4,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Platform.OS === 'web' ? 22 : 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: '#64748b',
    lineHeight: Platform.OS === 'web' ? 24 : 22,
  },
  footer: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  footerText: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 26 : 22,
    fontWeight: '500',
  },
  // Tab styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    margin: 16,
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: "#667eea",
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  activeTabText: {
    color: "#ffffff",
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Investment tracking styles
  investmentsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  sectionSubtitle: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: '#636e72',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: Platform.OS === 'web' ? 24 : 20,
  },
  investmentsList: {
    paddingBottom: 20,
  },
  investmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      maxWidth: 700,
      alignSelf: 'center',
    }),
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#667eea',
  },
  investmentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  investmentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  investmentTitle: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  investmentDateContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  investmentDate: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  investmentContent: {
    padding: 20,
  },
  investorSection: {
    marginBottom: 20,
  },
  playerSection: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoLabel: {
    fontSize: Platform.OS === 'web' ? 12 : 10,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#1e293b',
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    fontWeight: '600',
    color: '#636e72',
    width: Platform.OS === 'web' ? 80 : 70,
    marginRight: 8,
  },
  detailValue: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#2d3436',
    flex: 1,
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    fontWeight: 'bold',
    color: '#0984e3',
    marginBottom: 4,
  },
  upiItem: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
    borderWidth: 2,
    minWidth: '100%',
  },
  upiButton: {
    width: '100%',
  },
  upiLink: {
    color: '#0ea5e9',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace',
    fontSize: Platform.OS === 'web' ? 13 : 11,
    textDecorationLine: 'underline',
  },
  noUpiLink: {
    color: '#94a3b8',
    fontWeight: '500',
    textDecorationLine: 'none',
  },
  // Statistics styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statNumber: {
    fontSize: Platform.OS === 'web' ? 28 : 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: Platform.OS === 'web' ? 13 : 11,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    padding: 50,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: Platform.OS === 'web' ? 24 : 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 24 : 22,
  },
  // Loading styles
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    color: '#64748b',
    marginTop: 16,
    fontWeight: '500',
  },
});

export default AdminScreen;
