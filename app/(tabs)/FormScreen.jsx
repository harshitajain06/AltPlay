import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db, storage } from "../../config/firebase";

// Dropdown data
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const NATIONALITY_OPTIONS = [
  'India', 'Brazil', 'Argentina', 'Germany', 'France', 'Spain', 'Italy', 'England',
  'Portugal', 'Netherlands', 'Belgium', 'Croatia', 'Uruguay', 'Colombia', 'Mexico',
  'USA', 'Canada', 'Australia', 'Japan', 'South Korea', 'China', 'Nigeria', 'Ghana',
  'Egypt', 'Morocco', 'South Africa', 'Other'
];
const POSITION_OPTIONS = [
  'Goalkeeper', 'Defender', 'Center Back', 'Left Back', 'Right Back',
  'Midfielder', 'Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder',
  'Left Midfielder', 'Right Midfielder', 'Winger', 'Forward', 'Striker',
  'Left Winger', 'Right Winger', 'Second Striker'
];
const EXPERIENCE_OPTIONS = [
  '0-2 years', '3-5 years', '6-10 years', '11-15 years', '16-20 years', '20+ years'
];

// Custom Dropdown Component
const CustomDropdown = ({ options, selectedValue, onSelect, placeholder, style }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={style}>
      <TouchableOpacity
        style={[styles.input, styles.dropdownButton]}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[styles.dropdownText, !selectedValue && styles.placeholderText]}>
          {selectedValue || placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdownModal}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    selectedValue === item && styles.selectedDropdownItem
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setIsOpen(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedValue === item && styles.selectedDropdownItemText
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const PlayerForm = () => {
  const [user, loading, error] = useAuthState(auth);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [upiError, setUpiError] = useState(false);
  const [youtubeError, setYoutubeError] = useState(false);
  const [playerDocId, setPlayerDocId] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    dob: new Date(),
    nationality: "",
    city: "",
    phone: "",
    email: "",
    gender: "",
    profilePhoto: null,
    profilePhotoUrl: null,

    primaryPosition: "",
    secondaryPosition: "",
    height: "",
    weight: "",
    currentClub: "",
    experience: "",
    jerseyNumber: "",
    upiLink: "",
    youtubeUrl: "",
    investmentPurpose: "",
  });

  // Load existing player data and auto-populate email
  useEffect(() => {
    const loadPlayerData = async () => {
      if (!user) {
        setIsLoadingData(false);
        return;
      }

      // Auto-populate email from authenticated user
      setForm(prevForm => ({
        ...prevForm,
        email: user.email || ""
      }));

      try {
        let playerData = null;
        let docId = null;

        // First, try to find by userId field
        const playersQuery = query(
          collection(db, "players"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(playersQuery);

        if (!querySnapshot.empty) {
          // Player data exists, load it
          playerData = querySnapshot.docs[0].data();
          docId = querySnapshot.docs[0].id;
        } else {
          // Fallback: try to get document by user.uid as document ID
          try {
            const playerDocRef = doc(db, "players", user.uid);
            const playerDocSnap = await getDoc(playerDocRef);
            if (playerDocSnap.exists()) {
              playerData = playerDocSnap.data();
              docId = playerDocSnap.id;
            }
          } catch (docError) {
            console.log("No document found by ID either");
          }
        }

        if (playerData && docId) {
          setPlayerDocId(docId);

          // Convert Firestore Timestamp to Date if needed
          let dobDate = new Date();
          if (playerData.dob) {
            if (playerData.dob.toDate) {
              dobDate = playerData.dob.toDate();
            } else if (playerData.dob instanceof Date) {
              dobDate = playerData.dob;
            } else if (typeof playerData.dob === 'string' || typeof playerData.dob === 'number') {
              dobDate = new Date(playerData.dob);
            }
          }

          setForm({
            fullName: playerData.fullName || "",
            dob: dobDate,
            nationality: playerData.nationality || "",
            city: playerData.city || "",
            phone: playerData.phone || "",
            email: playerData.email || user.email || "",
            gender: playerData.gender || "",
            profilePhoto: null, // Don't load local URI, use URL instead
            profilePhotoUrl: playerData.profilePhoto || null,

            primaryPosition: playerData.primaryPosition || "",
            secondaryPosition: playerData.secondaryPosition || "",
            height: playerData.height || "",
            weight: playerData.weight || "",
            currentClub: playerData.currentClub || "",
            experience: playerData.experience || "",
            jerseyNumber: playerData.jerseyNumber || "",
            upiLink: playerData.upiLink || "",
            youtubeUrl: playerData.youtubeUrl || "",
            investmentPurpose: playerData.investmentPurpose || "",
          });
        }
      } catch (error) {
        console.error("Error loading player data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadPlayerData();
  }, [user]);

  // UPI link validation
  const validateUPILink = (upiLink) => {
    if (!upiLink) return true; // Optional field
    
    // Check if it's a valid UPI link or UPI ID
    const upiLinkRegex = /^(https?:\/\/)?(www\.)?(upi\.link\/|paytm\.me\/|phonepe\.me\/|gpay\.me\/)/i;
    const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    
    return upiLinkRegex.test(upiLink) || upiIdRegex.test(upiLink);
  };

  // YouTube URL validation
  const validateYouTubeUrl = (url) => {
    if (!url) return true; // Optional field
    
    // Check if it's a valid YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)[\w-]+/i;
    
    return youtubeRegex.test(url);
  };

  const pickImage = async (field) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setForm({ ...form, [field]: result.assets[0].uri });
    }
  };

  // Upload file to Firebase Storage with correct appspot.com URL
const uploadFile = async (uri, path) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, path);

  // Upload the file
  await uploadBytes(storageRef, blob);

  // Get the download URL
  let url = await getDownloadURL(storageRef);

  // Force the correct host (replace .firebasestorage.app with .appspot.com if needed)
  if (url.includes(".firebasestorage.app")) {
    url = url.replace(".firebasestorage.app", ".appspot.com");
  }

  return url;
};


  const handleSubmit = async () => {
    // Validate UPI link if provided
    if (form.upiLink && !validateUPILink(form.upiLink)) {
      alert("⚠️ Please enter a valid UPI link or UPI ID (e.g., https://upi.link/your-id or your-id@paytm)");
      return;
    }

    // Validate YouTube URL if provided
    if (form.youtubeUrl && !validateYouTubeUrl(form.youtubeUrl)) {
      alert("⚠️ Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID)");
      return;
    }

    if (!user) {
      alert("⚠️ Please log in to save your data");
      return;
    }

    setIsSubmitting(true);
    try {
      let photoURL = form.profilePhotoUrl; // Keep existing URL if no new photo uploaded
      
      // Upload new photo if one was selected
      if (form.profilePhoto) {
        photoURL = await uploadFile(
          form.profilePhoto,
          `players/${user.uid}_photo.jpg`
        );
      }

      // Prepare form data (exclude profilePhoto and profilePhotoUrl from the document)
      const { profilePhoto, profilePhotoUrl, ...formData } = form;
      
      const playerData = {
        ...formData,
        profilePhoto: photoURL,
        userId: user.uid,
        updatedAt: new Date(),
      };

      // If player document exists, update it; otherwise create new
      if (playerDocId) {
        await setDoc(doc(db, "players", playerDocId), playerData, { merge: true });
        alert("✅ Player details updated successfully!");
      } else {
        // Create new document with user's UID as document ID for easier lookup
        const newPlayerRef = doc(db, "players", user.uid);
        await setDoc(newPlayerRef, {
          ...playerData,
          createdAt: new Date(),
        });
        setPlayerDocId(user.uid);
        alert("🎉 Player registered successfully!");
      }

      // Update local state to reflect saved photo URL
      if (photoURL) {
        setForm(prev => ({
          ...prev,
          profilePhotoUrl: photoURL,
          profilePhoto: null, // Clear local photo after upload
        }));
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ Error saving data: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
        <ActivityIndicator size="large" color="#0984e3" />
        <Text style={{ marginTop: 10, color: '#636e72' }}>Loading your data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.stepText}>Step {step} of 2</Text>
      {playerDocId && (
        <Text style={[styles.stepText, { fontSize: 14, color: '#00b894', marginBottom: 5 }]}>
          ✏️ Edit your registration details
        </Text>
      )}

      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={form.fullName}
            onChangeText={(t) => setForm({ ...form, fullName: t })}
          />

          <Text style={styles.label}>Date of Birth</Text>
          <DateTimePicker
            value={form.dob}
            mode="date"
            onChange={(e, date) => {
              if (date) {
                setForm({ ...form, dob: date });
              }
            }}
          />

          <CustomDropdown
            options={NATIONALITY_OPTIONS}
            selectedValue={form.nationality}
            onSelect={(value) => setForm({ ...form, nationality: value })}
            placeholder="Select Nationality"
            style={{ marginBottom: 12 }}
          />

          <TextInput
            style={styles.input}
            placeholder="City & State"
            value={form.city}
            onChangeText={(t) => setForm({ ...form, city: t })}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(t) => setForm({ ...form, phone: t })}
          />

          <Text style={styles.label}>Email (from your account)</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            placeholder="Email"
            keyboardType="email-address"
            value={form.email}
            editable={false}
            selectTextOnFocus={false}
          />

          <CustomDropdown
            options={GENDER_OPTIONS}
            selectedValue={form.gender}
            onSelect={(value) => setForm({ ...form, gender: value })}
            placeholder="Select Gender"
            style={{ marginBottom: 12 }}
          />

          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => pickImage("profilePhoto")}
          >
            <Text style={styles.uploadBtnText}>📷 Upload Profile Photo</Text>
          </TouchableOpacity>

          {(form.profilePhoto || form.profilePhotoUrl) && (
            <Image
              source={{ uri: form.profilePhoto || form.profilePhotoUrl }}
              style={styles.imagePreview}
            />
          )}

          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
            <Text style={styles.nextBtnText}>Next ➡️</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Playing Details</Text>

          <CustomDropdown
            options={POSITION_OPTIONS}
            selectedValue={form.primaryPosition}
            onSelect={(value) => setForm({ ...form, primaryPosition: value })}
            placeholder="Select Primary Position"
            style={{ marginBottom: 12 }}
          />

          <CustomDropdown
            options={POSITION_OPTIONS}
            selectedValue={form.secondaryPosition}
            onSelect={(value) => setForm({ ...form, secondaryPosition: value })}
            placeholder="Select Secondary Position"
            style={{ marginBottom: 12 }}
          />

          <TextInput
            style={styles.input}
            placeholder="Height (cm)"
            keyboardType="numeric"
            value={form.height}
            onChangeText={(t) => setForm({ ...form, height: t })}
          />

          <TextInput
            style={styles.input}
            placeholder="Weight (kg)"
            keyboardType="numeric"
            value={form.weight}
            onChangeText={(t) => setForm({ ...form, weight: t })}
          />

          <TextInput
            style={styles.input}
            placeholder="Current Club/Academy"
            value={form.currentClub}
            onChangeText={(t) => setForm({ ...form, currentClub: t })}
          />

          <CustomDropdown
            options={EXPERIENCE_OPTIONS}
            selectedValue={form.experience}
            onSelect={(value) => setForm({ ...form, experience: value })}
            placeholder="Select Years of Experience"
            style={{ marginBottom: 12 }}
          />

          <TextInput
            style={styles.input}
            placeholder="Jersey Number"
            keyboardType="numeric"
            value={form.jerseyNumber}
            onChangeText={(t) => setForm({ ...form, jerseyNumber: t })}
          />

          <Text style={styles.label}>What do you need the investment for?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="E.g., Training equipment, coaching fees, tournament fees, travel expenses, etc."
            value={form.investmentPurpose}
            onChangeText={(t) => setForm({ ...form, investmentPurpose: t })}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.helpText}>
            💰 Explain how you plan to use the investment to improve your career
          </Text>

          <Text style={styles.label}>UPI Payment Link (for receiving investments)</Text>
          <TextInput
            style={[styles.input, upiError && styles.errorInput]}
            placeholder="https://upi.link/your-upi-id or UPI ID"
            value={form.upiLink}
            onChangeText={(t) => {
              setForm({ ...form, upiLink: t });
              setUpiError(false); // Clear error when user types
            }}
            onBlur={() => {
              if (form.upiLink && !validateUPILink(form.upiLink)) {
                setUpiError(true);
              } else {
                setUpiError(false);
              }
            }}
            keyboardType="url"
            autoCapitalize="none"
          />
          {upiError && (
            <Text style={styles.errorText}>
              ⚠️ Please enter a valid UPI link or UPI ID
            </Text>
          )}
          <Text style={styles.helpText}>
            💡 Provide your UPI link or UPI ID so investors can easily send you payments
          </Text>

          <Text style={styles.label}>YouTube Video URL (optional)</Text>
          <TextInput
            style={[styles.input, youtubeError && styles.errorInput]}
            placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
            value={form.youtubeUrl}
            onChangeText={(t) => {
              setForm({ ...form, youtubeUrl: t });
              setYoutubeError(false); // Clear error when user types
            }}
            onBlur={() => {
              if (form.youtubeUrl && !validateYouTubeUrl(form.youtubeUrl)) {
                setYoutubeError(true);
              } else {
                setYoutubeError(false);
              }
            }}
            keyboardType="url"
            autoCapitalize="none"
          />
          {youtubeError && (
            <Text style={styles.errorText}>
              ⚠️ Please enter a valid YouTube URL
            </Text>
          )}
          <Text style={styles.helpText}>
            🎥 Share a video showcasing your skills and gameplay
          </Text>

          <View style={styles.row}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backBtnText}>⬅️ Back</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.submitBtnText}>Submitting...</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>✅ Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f0f4f8" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginVertical: 12,
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#e8f4fd",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2d3436",
  },
  stepText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#636e72",
    textAlign: "center",
  },
  input: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    backgroundColor: "#ffffff",
    fontSize: 16,
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
    paddingBottom: 14,
  },
  readOnlyInput: {
    backgroundColor: "#e9ecef",
    color: "#6c757d",
    borderColor: "#ced4da",
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
    color: "#2d3436",
  },
  helpText: {
    fontSize: Platform.OS === 'web' ? 12 : 11,
    color: "#636e72",
    marginTop: 4,
    marginBottom: 12,
    fontStyle: "italic",
  },
  errorInput: {
    borderColor: "#e74c3c",
    borderWidth: 2,
  },
  errorText: {
    fontSize: Platform.OS === 'web' ? 12 : 11,
    color: "#e74c3c",
    marginTop: 4,
    marginBottom: 8,
    fontWeight: "500",
  },
  uploadBtn: {
    backgroundColor: "#74b9ff",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginVertical: 12,
    shadowColor: "#74b9ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 15,
    alignSelf: "center",
    marginVertical: 10,
  },
  nextBtn: {
    backgroundColor: "#00b894",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#00b894",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  nextBtnText: { color: "#fff", fontWeight: "bold", fontSize: 17 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  backBtn: {
    backgroundColor: "#b2bec3",
    padding: 14,
    borderRadius: 14,
    flex: 0.45,
    alignItems: "center",
    shadowColor: "#b2bec3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  backBtnText: { color: "#2d3436", fontWeight: "700", fontSize: 16 },
  submitBtn: {
    backgroundColor: "#0984e3",
    padding: 14,
    borderRadius: 14,
    flex: 0.45,
    alignItems: "center",
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  submitBtnDisabled: {
    backgroundColor: "#74b9ff",
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  // Dropdown styles
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 15,
  },
  dropdownText: {
    fontSize: 16,
    color: '#2d3436',
  },
  placeholderText: {
    color: '#636e72',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#636e72',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: 300,
    width: Platform.OS === 'web' ? 300 : '80%',
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e8f4fd',
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedDropdownItem: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#0984e3',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#2d3436',
  },
  selectedDropdownItemText: {
    color: '#1976d2',
    fontWeight: '600',
  },
});

export default PlayerForm;
