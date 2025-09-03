import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db, storage } from "../../config/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const PlayerForm = () => {
  const [step, setStep] = useState(1);
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
  });

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

          <TextInput
            style={styles.input}
            placeholder="Nationality"
            value={form.nationality}
            onChangeText={(t) => setForm({ ...form, nationality: t })}
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

          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(t) => setForm({ ...form, email: t })}
          />

          <TextInput
            style={styles.input}
            placeholder="Gender"
            value={form.gender}
            onChangeText={(t) => setForm({ ...form, gender: t })}
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

          <TextInput
            style={styles.input}
            placeholder="Primary Position"
            value={form.primaryPosition}
            onChangeText={(t) => setForm({ ...form, primaryPosition: t })}
          />

          <TextInput
            style={styles.input}
            placeholder="Secondary Position(s)"
            value={form.secondaryPosition}
            onChangeText={(t) => setForm({ ...form, secondaryPosition: t })}
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

          <TextInput
            style={styles.input}
            placeholder="Years of Playing Experience"
            keyboardType="numeric"
            value={form.experience}
            onChangeText={(t) => setForm({ ...form, experience: t })}
          />

          <TextInput
            style={styles.input}
            placeholder="Jersey Number"
            keyboardType="numeric"
            value={form.jerseyNumber}
            onChangeText={(t) => setForm({ ...form, jerseyNumber: t })}
          />

          <View style={styles.row}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backBtnText}>⬅️ Back</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>✅ Submit</Text>
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
  label: {
    fontWeight: "600",
    marginBottom: 6,
    color: "#2d3436",
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
});

export default PlayerForm;
