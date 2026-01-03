import {
  collection,
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
  View
} from "react-native";
import { auth, db } from "../../config/firebase";

const MyInvestmentsScreen = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

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

  const currentData = investments;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Investments</Text>
        <Text style={styles.headerCount}>({currentData.length})</Text>
      </View>
      {currentData.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>💰</Text>
          <Text style={styles.emptyText}>
            No investments made yet.
          </Text>
          <Text style={{ fontSize: 14, color: "#95a5a6", marginTop: 8, textAlign: "center", paddingHorizontal: 40 }}>
            Your investments will appear here once you start investing in players
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.playerName}>🎯 {item.playerName}</Text>
                <View style={styles.amountBadge}>
                  <Text style={styles.amountBadgeText}>
                    ₹{item.investmentAmount ? item.investmentAmount.toLocaleString() : "0"}
                  </Text>
                </View>
              </View>
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Investment Amount</Text>
                <Text style={styles.amountValue}>
                  ₹{item.investmentAmount ? item.investmentAmount.toLocaleString() : "0"}
                </Text>
              </View>
              <Text style={styles.detail}>
                ⏳ Invested on: {item.investedAt?.toDate().toDateString() || "-"}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f0f4f8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 24,
    backgroundColor: "#ffffff",
    borderBottomWidth: 2,
    borderBottomColor: "#e8f4fd",
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  headerCount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0984e3",
  },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: "#636e72", fontWeight: "500" },
  list: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e8f4fd",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  playerName: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#1a1a1a", 
    flex: 1,
  },
  amountBadge: {
    backgroundColor: "#00b894",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#00b894",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  amountBadgeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  amountSection: {
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 2,
    borderColor: "#0ea5e9",
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0ea5e9",
  },
  detail: { fontSize: 15, color: "#636e72", marginTop: 6 },
});

export default MyInvestmentsScreen;
