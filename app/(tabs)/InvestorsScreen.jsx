import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { auth, db } from "../../config/firebase";

export default function PlayerInvestorsScreen() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // 1. Find the player's Firestore doc using email
        const playerQuery = query(
          collection(db, "players"),
          where("email", "==", user.email)
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
              investmentId: docSnap.id,
              investedAt: data.investedAt,
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
        <ActivityIndicator size="large" color="#0984e3" />
        <Text style={styles.emptyText}>Loading investors...</Text>
      </View>
    );
  }

  if (investors.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>👥</Text>
        <Text style={styles.emptyText}>No investors yet.</Text>
        <Text style={{ fontSize: 14, color: "#95a5a6", marginTop: 8, textAlign: "center", paddingHorizontal: 40 }}>
          Investors who support you will appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Investors</Text>
      <FlatList
        data={investors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.investorCard}>
            <Text style={styles.name}>👤 {item.name || "Unnamed Investor"}</Text>
            <Text style={styles.details}>📧 {item.email}</Text>
            <Text style={styles.details}>💰 Invested Amount: ₹{item.amount}</Text>
            <Text style={styles.details}>
              ⏳ Invested on: {item.investedAt?.toDate().toDateString() || "Unknown Date"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8" },
  list: { padding: 16 },
  heading: { 
    fontSize: 28, 
    fontWeight: "800", 
    marginBottom: 24, 
    color: "#1a1a1a",
    textAlign: "center",
    marginTop: 20,
    letterSpacing: -0.5,
  },
  investorCard: { 
    padding: 20, 
    backgroundColor: "#fff", 
    borderRadius: 18, 
    marginBottom: 16,
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e8f4fd",
  },
  name: { fontSize: 18, fontWeight: "bold", color: "#2d3436", marginBottom: 8 },
  details: { fontSize: 14, color: "#636e72", marginTop: 4 },
  center: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: "#f0f4f8",
  },
  emptyText: { 
    fontSize: 18, 
    color: "#636e72",
    fontWeight: "500",
    marginTop: 12,
  },
});
