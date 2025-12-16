import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { addDoc, collection } from "firebase/firestore";
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
  const [upiError, setUpiError] = useState(false);
  const [youtubeError, setYoutubeError] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    dob: new Date(),
    nationality: "",
    city: "",
    phone: "",
    email: "",
    gender: "",
    profilePhoto: null,

    primaryPosition: "",
    secondaryPosition: "",
    height: "",
    weight: "",
    currentClub: "",
    experience: "",
    jerseyNumber: "",
    upiLink: "",
    youtubeUrl: "",
  });

  // Auto-populate email from authenticated user
  useEffect(() => {
    if (user && user.email) {
      setForm(prevForm => ({
        ...prevForm,
        email: user.email
      }));
    }
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

    setIsSubmitting(true);
    try {
      let photoURL = null;
      if (form.profilePhoto) {
        photoURL = await uploadFile(
          form.profilePhoto,
          `players/${form.fullName}_photo.jpg`
        );
      }

      await addDoc(collection(db, "players"), {
        ...form,
        profilePhoto: photoURL,
        createdAt: new Date(),
      });

      alert("🎉 Player registered successfully!");
    } catch (error) {
      console.error(error);
      alert("⚠️ Error saving data");
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.stepText}>Step {step} of 2</Text>

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
            onChange={(e, date) => setForm({ ...form, dob: date })}
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

          {form.profilePhoto && (
            <Image
              source={{ uri: form.profilePhoto }}
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
  container: { padding: 20, backgroundColor: "#f5f7fa" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
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
    borderWidth: 1,
    borderColor: "#dfe6e9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
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
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  uploadBtnText: { color: "#fff", fontWeight: "bold" },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 15,
    alignSelf: "center",
    marginVertical: 10,
  },
  nextBtn: {
    backgroundColor: "#00b894",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  nextBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  backBtn: {
    backgroundColor: "#b2bec3",
    padding: 12,
    borderRadius: 10,
    flex: 0.45,
    alignItems: "center",
  },
  backBtnText: { color: "#2d3436", fontWeight: "600" },
  submitBtn: {
    backgroundColor: "#0984e3",
    padding: 12,
    borderRadius: 10,
    flex: 0.45,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontWeight: "bold" },
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
    borderRadius: 10,
    maxHeight: 300,
    width: Platform.OS === 'web' ? 300 : '80%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedDropdownItem: {
    backgroundColor: '#e3f2fd',
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
