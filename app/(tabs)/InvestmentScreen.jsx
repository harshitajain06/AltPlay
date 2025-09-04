import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../../config/firebase";

const MyInvestmentsScreen = () => {
  const [investments, setInvestments] = useState([]);
  const [receivedInvestments, setReceivedInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('made'); // 'made' or 'received'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get user role
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }

        // Fetch investments made by user (as investor)
        const investmentsQuery = query(
          collection(db, "investments"),
          where("investorId", "==", user.uid)
        );
        const investmentsSnapshot = await getDocs(investmentsQuery);
        const investmentsData = investmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setInvestments(investmentsData);

        // Fetch investments received by user (as player)
        const receivedQuery = query(
          collection(db, "investments"),
          where("playerId", "==", user.uid)
        );
        const receivedSnapshot = await getDocs(receivedQuery);
        const receivedData = await Promise.all(
          receivedSnapshot.docs.map(async (doc) => {
            const data = { id: doc.id, ...doc.data() };
            // Get investor name
            try {
              const investorDoc = await getDoc(doc(db, "users", data.investorId));
              if (investorDoc.exists()) {
                data.investorName = investorDoc.data().name || investorDoc.data().email || "Unknown Investor";
              } else {
                data.investorName = "Unknown Investor";
              }
            } catch (error) {
              console.error("Error fetching investor name:", error);
              data.investorName = "Unknown Investor";
            }
            return data;
          })
        );
        setReceivedInvestments(receivedData);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0984e3" />
      </View>
    );
  }

  // Determine which data to show based on user role and active tab
  const getCurrentData = () => {
    if (userRole === 'investor' && activeTab === 'made') {
      return investments;
    } else if (userRole === 'player' && activeTab === 'received') {
      return receivedInvestments;
    } else if (userRole === 'investor' && activeTab === 'received') {
      return receivedInvestments;
    } else if (userRole === 'player' && activeTab === 'made') {
      return investments;
    }
    return [];
  };

  const currentData = getCurrentData();
  const showTabs = userRole === 'investor' || (investments.length > 0 && receivedInvestments.length > 0);

  if (currentData.length === 0 && !showTabs) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          {userRole === 'player' ? 'No investments received yet.' : 'No investments made yet.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showTabs && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'made' && styles.activeTab]}
            onPress={() => setActiveTab('made')}
          >
            <Text style={[styles.tabText, activeTab === 'made' && styles.activeTabText]}>
              💰 Made ({investments.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'received' && styles.activeTab]}
            onPress={() => setActiveTab('received')}
          >
            <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
              📈 Received ({receivedInvestments.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {currentData.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {activeTab === 'made' ? 'No investments made yet.' : 'No investments received yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {activeTab === 'made' ? (
                <>
                  <Text style={styles.playerName}>🎯 {item.playerName}</Text>
                  <Text style={styles.detail}>
                    ⏳ Invested on: {item.investedAt?.toDate().toDateString() || "-"}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.playerName}>👤 {item.investorName || "Unknown Investor"}</Text>
                  <Text style={styles.detail}>
                    ⏳ Invested on: {item.investedAt?.toDate().toDateString() || "-"}
                  </Text>
                </>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#636e72" },
  list: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  playerName: { fontSize: 18, fontWeight: "bold", color: "#2d3436" },
  detail: { fontSize: 14, color: "#636e72", marginTop: 4 },
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
});

export default MyInvestmentsScreen;
