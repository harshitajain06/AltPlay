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
  Linking,
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
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚽</Text>
        <Text style={styles.emptyText}>No players registered yet.</Text>
        <Text style={{ fontSize: 14, color: "#95a5a6", marginTop: 8, textAlign: "center", paddingHorizontal: 40 }}>
          Players will appear here once they register
        </Text>
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

              {/* YouTube Video */}
              {selectedPlayer.youtubeUrl && (
                <>
                  <Text style={styles.sectionTitle}>Video</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        window.open(selectedPlayer.youtubeUrl, '_blank');
                      } else {
                        Linking.openURL(selectedPlayer.youtubeUrl);
                      }
                    }}
                    style={styles.youtubeLink}
                  >
                    <Text style={styles.youtubeLinkText}>
                      🎥 Watch on YouTube
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.modalDetail, styles.youtubeUrl]}>
                    {selectedPlayer.youtubeUrl}
                  </Text>
                </>
              )}
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
  loader: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#f0f4f8",
  },
  empty: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#f0f4f8",
  },
  emptyText: { 
    fontSize: 18, 
    color: "#636e72",
    fontWeight: "500",
    marginTop: 12,
  },
  list: { padding: 16 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    cursor: Platform.OS === "web" ? "pointer" : "auto",
    borderWidth: 1,
    borderColor: "#e8f4fd",
    ...(Platform.OS === "web" && {
      transition: "all 0.3s ease",
    }),
  },
  avatar: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    marginRight: 16,
    borderWidth: 3,
    borderColor: "#e8f4fd",
  },
  placeholder: { 
    backgroundColor: "#e3f2fd",
    borderWidth: 3,
    borderColor: "#b3d9ff",
  },
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
    maxWidth: 520,
    maxHeight: "85%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    flex: 1,
    borderWidth: 1,
    borderColor: "#e8f4fd",
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
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginRight: 8,
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: "#b2bec3",
    shadowOpacity: 0,
  },
  investButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  closeButton: {
    flex: 1,
    backgroundColor: "#d63031",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "#d63031",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  
  // YouTube Video Styles
  youtubeLink: {
    backgroundColor: "#FF0000",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginVertical: 10,
    shadowColor: "#FF0000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  youtubeLinkText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  youtubeUrl: {
    fontSize: 12,
    color: "#636e72",
    fontStyle: "italic",
    marginTop: 4,
    textAlign: "center",
  },
});

export default PlayerScreen;
