import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { auth, db } from "../../config/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export default function PlayerInvestorsScreen() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // 1. Find the player's Firestore doc (if you store userId in players)
        const playerQuery = query(
          collection(db, "players"),
          where("userId", "==", user.uid) // player doc linked to auth.uid
        );

        const playerSnapshot = await getDocs(playerQuery);
        if (playerSnapshot.empty) {
          console.log("No player profile found for this user.");
          setLoading(false);
          return;
        }

        const playerDoc = playerSnapshot.docs[0];
        const playerId = playerDoc.id;

        // 2. Fetch all investments for this player
        const investmentsQuery = query(
          collection(db, "investments"),
          where("playerId", "==", playerId)
        );
        const investmentSnapshot = await getDocs(investmentsQuery);

        const investorData = [];
        for (const docSnap of investmentSnapshot.docs) {
          const data = docSnap.data();

          // 3. Get investor details
          const investorRef = doc(db, "users", data.investorId);
          const investorSnap = await getDoc(investorRef);

          if (investorSnap.exists()) {
            investorData.push({
              id: investorSnap.id,
              ...investorSnap.data(),
              amount: data.amount || "N/A", // default if not stored
            });
          }
        }

        setInvestors(investorData);
      } catch (error) {
        console.error("Error fetching investors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestors();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (investors.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No investors yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Investors</Text>
      <FlatList
        data={investors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.investorCard}>
            <Text style={styles.name}>{item.name || "Unnamed Investor"}</Text>
            <Text style={styles.details}>Email: {item.email}</Text>
            <Text style={styles.details}>Invested Amount: ₹{item.amount}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  investorCard: { padding: 16, backgroundColor: "#f5f5f5", borderRadius: 10, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: "600" },
  details: { fontSize: 14, color: "#555", marginTop: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 16, color: "#888" },
});
