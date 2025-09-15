import { useNavigation } from '@react-navigation/native';
import {
    collection,
    getDoc,
    getDocs,
    orderBy,
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
        collection(db, "investments"),
        orderBy("investedAt", "desc")
      );
      const investmentsSnapshot = await getDocs(investmentsQuery);
      
      const investmentData = await Promise.all(
        investmentsSnapshot.docs.map(async (doc) => {
          const data = { id: doc.id, ...doc.data() };
          
          // Get investor details
          try {
            const investorDoc = await getDoc(doc(db, "users", data.investorId));
            if (investorDoc.exists()) {
              data.investor = investorDoc.data();
            }
          } catch (error) {
            console.error("Error fetching investor:", error);
            data.investor = { name: "Unknown Investor", email: "N/A" };
          }
          
          // Get player details
          try {
            const playerDoc = await getDoc(doc(db, "players", data.playerId));
            if (playerDoc.exists()) {
              data.player = { id: playerDoc.id, ...playerDoc.data() };
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
      <View style={styles.investmentHeader}>
        <Text style={styles.investmentTitle}>💰 Investment</Text>
        <Text style={styles.investmentDate}>
          {item.investedAt?.toDate().toLocaleDateString() || "Unknown Date"}
        </Text>
      </View>
      
      <View style={styles.investmentDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Investor:</Text>
          <Text style={styles.detailValue}>
            {item.investor?.name || "Unknown"} ({item.investor?.email || "N/A"})
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Player:</Text>
          <Text style={styles.detailValue}>
            {item.player?.fullName || "Unknown"} ({item.player?.email || "N/A"})
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Position:</Text>
          <Text style={styles.detailValue}>
            {item.player?.primaryPosition || "N/A"}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Club:</Text>
          <Text style={styles.detailValue}>
            {item.player?.currentClub || "Free Agent"}
          </Text>
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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/images/Logo.png')} style={styles.logo} />
        </View>

        {/* Title and Subtitle */}
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Alt Play</Text>
        <Text style={styles.tagline}>Platform Management</Text>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              📊 Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'investments' && styles.activeTab]}
            onPress={() => setActiveTab('investments')}
          >
            <Text style={[styles.tabText, activeTab === 'investments' && styles.activeTabText]}>
              💰 Investments ({investments.length})
            </Text>
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
  // Tab styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#0984e3",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#636e72",
  },
  activeTabText: {
    color: "#fff",
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#0984e3',
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  investmentTitle: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  investmentDate: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#636e72',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  investmentDetails: {
    gap: 8,
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
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: '#636e72',
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 24 : 20,
  },
  // Loading styles
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: '#636e72',
    marginTop: 12,
  },
});

export default AdminScreen;
