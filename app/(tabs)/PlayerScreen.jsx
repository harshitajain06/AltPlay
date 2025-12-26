import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
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
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { auth, db } from "../../config/firebase";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 12;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (width - CARD_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

const PlayerScreen = () => {
  const navigation = useNavigation();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasInvested, setHasInvested] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

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

  const fetchUserProfile = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to view your profile.");
      return;
    }

    setLoadingProfile(true);
    try {
      // Try to find user's profile by userId field
      const playersQuery = query(
        collection(db, "players"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(playersQuery);

      if (!querySnapshot.empty) {
        const profileData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
          // Use auth email if profile email is not available
          email: querySnapshot.docs[0].data().email || user.email,
        };
        setUserProfile(profileData);
        setProfileModalVisible(true);
      } else {
        // Fallback: try document ID
        const playerDocRef = doc(db, "players", user.uid);
        const playerDocSnap = await getDoc(playerDocRef);
        if (playerDocSnap.exists()) {
          const profileData = {
            id: playerDocSnap.id,
            ...playerDocSnap.data(),
            // Use auth email if profile email is not available
            email: playerDocSnap.data().email || user.email,
          };
          setUserProfile(profileData);
          setProfileModalVisible(true);
        } else {
          // If no player profile found, show auth user info
          const profileData = {
            fullName: user.displayName || "User",
            email: user.email || "No email available",
          };
          setUserProfile(profileData);
          setProfileModalVisible(true);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Fallback to auth user info on error
      const user = auth.currentUser;
      if (user) {
        const profileData = {
          fullName: user.displayName || "User",
          email: user.email || "No email available",
        };
        setUserProfile(profileData);
        setProfileModalVisible(true);
      } else {
        alert("Failed to load profile. Please try again.");
      }
    } finally {
      setLoadingProfile(false);
    }
  };

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

  const handleViewGraph = () => {
    if (!selectedPlayer) return;
    
    // Get the userId from the player document (could be in userId field or document ID)
    const playerUserId = selectedPlayer.userId || selectedPlayer.id;
    
    // Navigate to PerformanceGraph screen with player info
    navigation.navigate("PerformanceGraph", {
      playerId: playerUserId,
      playerName: selectedPlayer.fullName,
    });
    
    // Close the modal
    setModalVisible(false);
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

  const renderItem = ({ item, index }) => {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify().damping(15)}
        style={[styles.gridCardContainer, { width: CARD_WIDTH }]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.gridCard,
            pressed && styles.gridCardPressed,
          ]}
          onPress={() => handleOpenPlayer(item.id)}
        >
          <Animated.View
            entering={FadeInUp.delay(index * 100 + 50).springify()}
            style={styles.cardImageContainer}
          >
            {item.profilePhoto ? (
              <Image source={{ uri: item.profilePhoto }} style={styles.gridAvatar} />
            ) : (
              <View style={[styles.gridAvatar, styles.placeholder]}>
                <Ionicons name="person" size={40} color="#0984e3" />
              </View>
            )}
          </Animated.View>

          <View style={styles.gridInfo}>
            <Text style={styles.gridName} numberOfLines={1}>
              {item.fullName}
            </Text>
            <Text style={styles.gridPosition} numberOfLines={1}>
              {item.primaryPosition}
              {item.secondaryPosition ? ` | ${item.secondaryPosition}` : ""}
            </Text>
            <Text style={styles.gridClub} numberOfLines={1}>
              {item.currentClub || "Free Agent"}
            </Text>
            <View style={styles.gridStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>📏</Text>
                <Text style={styles.statValue}>{item.height}cm</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>⚖️</Text>
                <Text style={styles.statValue}>{item.weight}kg</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>🎽</Text>
                <Text style={styles.statValue}>#{item.jerseyNumber}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header with Profile Icon */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Players</Text>
        <TouchableOpacity
          style={styles.profileIconButton}
          onPress={fetchUserProfile}
          disabled={loadingProfile}
        >
          {loadingProfile ? (
            <ActivityIndicator size="small" color="#0984e3" />
          ) : (
            <Ionicons name="person-circle" size={32} color="#0984e3" />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={players}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.gridList}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={true}
        removeClippedSubviews={false}
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

              {/* Investment Purpose */}
              {selectedPlayer.investmentPurpose && (
                <>
                  <Text style={styles.sectionTitle}>Investment Purpose</Text>
                  <View style={styles.investmentPurposeContainer}>
                    <Text style={styles.investmentPurposeText}>
                      {selectedPlayer.investmentPurpose}
                    </Text>
                  </View>
                </>
              )}

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
                style={styles.graphButton}
                onPress={handleViewGraph}
              >
                <Text style={styles.graphButtonText}>📈 View Graph</Text>
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

      {/* User Profile Modal - Simplified to show only name and email */}
      {profileModalVisible && userProfile && (
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalBox}>
            <View style={styles.profileContent}>
              {userProfile.profilePhoto && (
                <Image
                  source={{ uri: userProfile.profilePhoto }}
                  style={styles.profileImage}
                />
              )}
              {!userProfile.profilePhoto && (
                <View style={styles.profileIconContainer}>
                  <Ionicons name="person-circle" size={80} color="#0984e3" />
                </View>
              )}
              
              <Text style={styles.profileName}>
                {userProfile.fullName || userProfile.name || "User"}
              </Text>
              
              <View style={styles.profileDetails}>
                <View style={styles.profileDetailRow}>
                  <Ionicons name="mail-outline" size={20} color="#0984e3" />
                  <Text style={styles.profileDetailText}>
                    {userProfile.email || "No email available"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.profileCloseButton}
              onPress={() => setProfileModalVisible(false)}
            >
              <Text style={styles.profileCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "web" ? 20 : 50,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8f4fd",
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
  },
  profileIconButton: {
    padding: 4,
  },
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
  gridList: { 
    padding: CARD_MARGIN,
    paddingBottom: CARD_MARGIN + 20,
  },
  row: {
    justifyContent: "space-between",
  },
  gridCardContainer: {
    marginBottom: CARD_MARGIN,
  },
  gridCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#e8f4fd",
    overflow: "hidden",
    minHeight: 280,
    ...(Platform.OS === "web" && {
      cursor: "pointer",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    }),
  },
  gridCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardImageContainer: {
    alignItems: "center",
    marginBottom: 14,
    marginTop: 4,
  },
  gridAvatar: { 
    width: 110, 
    height: 110, 
    borderRadius: 55, 
    borderWidth: 4,
    borderColor: "#0984e3",
    backgroundColor: "#f0f4f8",
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  placeholder: { 
    backgroundColor: "#e3f2fd",
    borderWidth: 4,
    borderColor: "#0984e3",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  gridInfo: { 
    alignItems: "center",
    width: "100%",
  },
  gridName: { 
    fontSize: 17, 
    fontWeight: "bold", 
    color: "#2d3436",
    marginBottom: 6,
    marginTop: 4,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  gridPosition: { 
    fontSize: 13, 
    color: "#636e72", 
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  gridClub: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: "#0984e3",
    marginBottom: 12,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  gridStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: "#e8f4fd",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 18,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 11,
    color: "#2d3436",
    fontWeight: "600",
    letterSpacing: 0.3,
  },

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
  investmentPurposeContainer: {
    backgroundColor: "#f0f4f8",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#0984e3",
  },
  investmentPurposeText: {
    fontSize: 15,
    color: "#2d3436",
    lineHeight: 22,
    fontWeight: "500",
  },

  // Buttons
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    flexWrap: "wrap",
  },
  investButton: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#0984e3",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginRight: 4,
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
  graphButton: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#00b894",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#00b894",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  graphButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  closeButton: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#d63031",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginLeft: 4,
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
  // UPI Link Styles
  upiLink: {
    backgroundColor: "#6c5ce7",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginVertical: 10,
    shadowColor: "#6c5ce7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upiLinkText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  
  // Profile Modal Styles
  profileModalBox: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#e8f4fd",
    alignItems: "center",
  },
  profileContent: {
    alignItems: "center",
    width: "100%",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#e8f4fd",
  },
  profileIconContainer: {
    marginBottom: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 24,
    textAlign: "center",
  },
  profileDetails: {
    width: "100%",
    marginBottom: 24,
  },
  profileDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f0f4f8",
    borderRadius: 12,
    marginBottom: 12,
  },
  profileDetailText: {
    fontSize: 16,
    color: "#2d3436",
    marginLeft: 12,
    flex: 1,
    textAlign: "center",
  },
  profileCloseButton: {
    width: "100%",
    backgroundColor: "#0984e3",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  profileCloseButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default PlayerScreen;
