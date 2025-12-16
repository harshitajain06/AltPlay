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
          <Text style={styles.emptyText}>
            No investments made yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.playerName}>🎯 {item.playerName}</Text>
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
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 20,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3436",
  },
  headerCount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0984e3",
  },
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
});

export default MyInvestmentsScreen;
