import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";

const MyInvestmentsScreen = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

       const q = query(
  collection(db, "investments"),
  where("investorId", "==", user.uid)
);


        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setInvestments(data);
      } catch (error) {
        console.error("Error fetching investments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0984e3" />
      </View>
    );
  }

  if (investments.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No investments yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={investments}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.playerName}>{item.playerName}</Text>
          <Text style={styles.detail}>
            ⏳ {item.investedAt?.toDate().toDateString() || "-"}
          </Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
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
});

export default MyInvestmentsScreen;
