import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../config/firebase";

const PlayerScreen = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasInvested, setHasInvested] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "players"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPlayers(data);
      } catch (error) {
        console.error("Error fetching players:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const checkInvestment = async (playerId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "investments"),
        where("investorId", "==", user.uid),
        where("playerId", "==", playerId)
      );
      const querySnapshot = await getDocs(q);

      setHasInvested(!querySnapshot.empty);
    } catch (err) {
      console.error("Error checking investment:", err);
    }
  };

  const handleOpenPlayer = async (playerId) => {
    try {
      const docRef = doc(db, "players", playerId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const playerData = { id: snapshot.id, ...snapshot.data() };
        setSelectedPlayer(playerData);
        await checkInvestment(playerData.id); // check before opening modal
        setModalVisible(true);
      }
    } catch (error) {
      console.error("Error fetching player details:", error);
    }
  };

  const handleInvest = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in to invest.");
        return;
      }

      if (hasInvested) return; // safeguard

      await addDoc(collection(db, "investments"), {
        investorId: user.uid,
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.fullName,
        investedAt: serverTimestamp(),
      });

      setHasInvested(true);
      alert(`✅ You invested in ${selectedPlayer.fullName}`);
    } catch (err) {
      console.error("Investment error:", err);
      alert("❌ Failed to invest. Try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0984e3" />
      </View>
    );
  }

  if (players.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No players registered yet.</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleOpenPlayer(item.id)}
    >
      {item.profilePhoto ? (
        <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholder]} />
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.position}>
          {item.primaryPosition}{" "}
          {item.secondaryPosition ? `| ${item.secondaryPosition}` : ""}
        </Text>
        <Text style={styles.club}>{item.currentClub || "Free Agent"}</Text>
        <Text style={styles.details}>
          📏 {item.height} cm | ⚖️ {item.weight} kg | 🎽 #{item.jerseyNumber}
        </Text>
        <Text style={styles.contact}>
          📧 {item.email} | 📞 {item.phone}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={players}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      {/* Custom modal for web + mobile */}
      {modalVisible && selectedPlayer && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {/* Scrollable Content */}
            <ScrollView 
              showsVerticalScrollIndicator={true}
              bounces={true}
              scrollEventThrottle={16}
              contentContainerStyle={styles.scrollContent}
              style={styles.scrollView}
            >
              {selectedPlayer.profilePhoto && (
                <Image
                  source={{ uri: selectedPlayer.profilePhoto }}
                  style={styles.modalImage}
                />
              )}
              <Text style={styles.modalName}>{selectedPlayer.fullName}</Text>

              {/* Personal Info */}
              <Text style={styles.sectionTitle}>Personal Info</Text>
              <Text style={styles.modalDetail}>
                📅 DOB:{" "}
                {selectedPlayer.dob?.seconds
                  ? new Date(selectedPlayer.dob.seconds * 1000).toDateString()
                  : "-"}
              </Text>
              <Text style={styles.modalDetail}>🌍 {selectedPlayer.nationality}</Text>
              <Text style={styles.modalDetail}>🏙️ {selectedPlayer.city}</Text>
              <Text style={styles.modalDetail}>📧 {selectedPlayer.email}</Text>
              <Text style={styles.modalDetail}>📞 {selectedPlayer.phone}</Text>
              <Text style={styles.modalDetail}>⚧️ {selectedPlayer.gender}</Text>

              {/* Playing Info */}
              <Text style={styles.sectionTitle}>Playing Info</Text>
              <Text style={styles.modalDetail}>
                🎯 Primary: {selectedPlayer.primaryPosition}
              </Text>
              <Text style={styles.modalDetail}>
                🎯 Secondary: {selectedPlayer.secondaryPosition || "-"}
              </Text>
              <Text style={styles.modalDetail}>📏 {selectedPlayer.height} cm</Text>
              <Text style={styles.modalDetail}>⚖️ {selectedPlayer.weight} kg</Text>
              <Text style={styles.modalDetail}>
                🏟️ Club: {selectedPlayer.currentClub || "Free Agent"}
              </Text>
              <Text style={styles.modalDetail}>
                ⏳ Experience: {selectedPlayer.experience} yrs
              </Text>
              <Text style={styles.modalDetail}>
                🎽 Jersey: #{selectedPlayer.jerseyNumber}
              </Text>
            </ScrollView>

            {/* Fixed Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.investButton,
                  hasInvested && styles.disabledButton,
                ]}
                onPress={handleInvest}
                disabled={hasInvested}
              >
                <Text style={styles.investButtonText}>
                  {hasInvested ? "✅ Already Invested" : "💰 Invest Now"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>❌ Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#636e72" },
  list: { padding: 16 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    cursor: Platform.OS === "web" ? "pointer" : "auto",
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 12 },
  placeholder: { backgroundColor: "#dfe6e9" },
  info: { flex: 1, justifyContent: "center" },
  name: { fontSize: 18, fontWeight: "bold", color: "#2d3436" },
  position: { fontSize: 14, color: "#636e72", marginVertical: 2 },
  club: { fontSize: 14, fontWeight: "600", color: "#0984e3" },
  details: { fontSize: 12, color: "#636e72", marginTop: 4 },
  contact: { fontSize: 12, color: "#636e72", marginTop: 4 },

  // Modal
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginBottom: 20,
    ...(Platform.OS === 'web' && {
      maxHeight: '60vh',
      overflow: 'auto',
    }),
  },
  scrollContent: {
    paddingBottom: 10,
    ...(Platform.OS === 'web' && {
      paddingRight: 10,
    }),
  },
  modalImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 15,
  },
  modalName: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    color: "#2d3436",
  },
  modalDetail: { fontSize: 14, color: "#2d3436", marginVertical: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 8,
    color: "#0984e3",
  },

  // Buttons
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  investButton: {
    flex: 1,
    backgroundColor: "#0984e3",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: "#b2bec3",
  },
  investButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  closeButton: {
    flex: 1,
    backgroundColor: "#d63031",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 8,
  },
  closeButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default PlayerScreen;
