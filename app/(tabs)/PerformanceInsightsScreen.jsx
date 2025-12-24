import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Svg, Polyline, Line, Circle, Text as SvgText, G } from "react-native-svg";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 100;
const CHART_HEIGHT = 300;
const PADDING = 50;

const PerformanceInsightsScreen = () => {
  const [user, loading] = useAuthState(auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [updateChanges, setUpdateChanges] = useState(null);

  const [form, setForm] = useState({
    seasonYear: "",
    clubTeam: "",
    leagueTournament: "",
    matchesPlayed: "",
    minutesPlayed: "",
    goalsScored: "",
    assists: "",
    shotsOnTargetPercent: "",
    passAccuracyPercent: "",
    keyPasses: "",
    dribblesCompleted: "",
    tacklesWon: "",
    interceptions: "",
    duelsWonPercent: "",
    crossAccuracyPercent: "",
    cleanSheets: "",
    savesMade: "",
    savePercent: "",
    yellowCards: "",
    redCards: "",
  });

  useEffect(() => {
    const loadPerformanceData = async () => {
      if (!user) {
        setIsLoadingData(false);
        return;
      }

      try {
        // Find the latest performance data for this user
        const performanceQuery = query(
          collection(db, "performanceInsights"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(performanceQuery);

        if (!querySnapshot.empty) {
          // Get the most recent entry
          const docs = querySnapshot.docs;
          const latestDoc = docs.reduce((latest, current) => {
            const latestTime = latest.data().createdAt?.toMillis() || 0;
            const currentTime = current.data().createdAt?.toMillis() || 0;
            return currentTime > latestTime ? current : latest;
          });

          const data = latestDoc.data();
          setForm({
            seasonYear: data.seasonYear || "",
            clubTeam: data.clubTeam || "",
            leagueTournament: data.leagueTournament || "",
            matchesPlayed: data.matchesPlayed?.toString() || "",
            minutesPlayed: data.minutesPlayed?.toString() || "",
            goalsScored: data.goalsScored?.toString() || "",
            assists: data.assists?.toString() || "",
            shotsOnTargetPercent: data.shotsOnTargetPercent?.toString() || "",
            passAccuracyPercent: data.passAccuracyPercent?.toString() || "",
            keyPasses: data.keyPasses?.toString() || "",
            dribblesCompleted: data.dribblesCompleted?.toString() || "",
            tacklesWon: data.tacklesWon?.toString() || "",
            interceptions: data.interceptions?.toString() || "",
            duelsWonPercent: data.duelsWonPercent?.toString() || "",
            crossAccuracyPercent: data.crossAccuracyPercent?.toString() || "",
            cleanSheets: data.cleanSheets?.toString() || "",
            savesMade: data.savesMade?.toString() || "",
            savePercent: data.savePercent?.toString() || "",
            yellowCards: data.yellowCards?.toString() || "",
            redCards: data.redCards?.toString() || "",
          });
          setHasExistingData(true);
        }
      } catch (error) {
        console.error("Error loading performance data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadPerformanceData();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Error", "Please log in to save your data");
      return;
    }

    // Validate required fields
    if (!form.seasonYear || !form.clubTeam || !form.leagueTournament) {
      Alert.alert("Error", "Please fill in Season/Year, Club/Team, and League/Tournament");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get previous data to compare
      const previousQuery = query(
        collection(db, "performanceInsights"),
        where("userId", "==", user.uid)
      );
      const previousSnapshot = await getDocs(previousQuery);
      
      let previousData = null;
      if (!previousSnapshot.empty) {
        const docs = previousSnapshot.docs;
        const latestDoc = docs.reduce((latest, current) => {
          const latestData = latest.data();
          const currentData = current.data();
          const latestTime = latestData.createdAt?.toMillis?.() || 
                            latestData.updatedAt?.toMillis?.() || 
                            latestData.createdAt || 0;
          const currentTime = currentData.createdAt?.toMillis?.() || 
                             currentData.updatedAt?.toMillis?.() || 
                             currentData.createdAt || 0;
          return currentTime > latestTime ? current : latest;
        });
        previousData = latestDoc.data();
      }

      // Prepare new data
      const performanceData = {
        userId: user.uid,
        seasonYear: form.seasonYear,
        clubTeam: form.clubTeam,
        leagueTournament: form.leagueTournament,
        matchesPlayed: form.matchesPlayed ? parseFloat(form.matchesPlayed) : null,
        minutesPlayed: form.minutesPlayed ? parseFloat(form.minutesPlayed) : null,
        goalsScored: form.goalsScored ? parseFloat(form.goalsScored) : null,
        assists: form.assists ? parseFloat(form.assists) : null,
        shotsOnTargetPercent: form.shotsOnTargetPercent ? parseFloat(form.shotsOnTargetPercent) : null,
        passAccuracyPercent: form.passAccuracyPercent ? parseFloat(form.passAccuracyPercent) : null,
        keyPasses: form.keyPasses ? parseFloat(form.keyPasses) : null,
        dribblesCompleted: form.dribblesCompleted ? parseFloat(form.dribblesCompleted) : null,
        tacklesWon: form.tacklesWon ? parseFloat(form.tacklesWon) : null,
        interceptions: form.interceptions ? parseFloat(form.interceptions) : null,
        duelsWonPercent: form.duelsWonPercent ? parseFloat(form.duelsWonPercent) : null,
        crossAccuracyPercent: form.crossAccuracyPercent ? parseFloat(form.crossAccuracyPercent) : null,
        cleanSheets: form.cleanSheets ? parseFloat(form.cleanSheets) : null,
        savesMade: form.savesMade ? parseFloat(form.savesMade) : null,
        savePercent: form.savePercent ? parseFloat(form.savePercent) : null,
        yellowCards: form.yellowCards ? parseFloat(form.yellowCards) : null,
        redCards: form.redCards ? parseFloat(form.redCards) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Store changes if previous data exists
      let changes = {};
      if (previousData) {
        const numericFields = [
          "matchesPlayed", "minutesPlayed", "goalsScored", "assists",
          "shotsOnTargetPercent", "passAccuracyPercent", "keyPasses",
          "dribblesCompleted", "tacklesWon", "interceptions",
          "duelsWonPercent", "crossAccuracyPercent", "cleanSheets",
          "savesMade", "savePercent", "yellowCards", "redCards"
        ];

        numericFields.forEach((field) => {
          const oldValue = previousData[field];
          const newValue = performanceData[field];
          if (oldValue !== null && oldValue !== undefined && 
              newValue !== null && newValue !== undefined && 
              oldValue !== newValue) {
            changes[field] = {
              old: oldValue,
              new: newValue,
              timestamp: serverTimestamp(),
            };
          }
        });

        if (Object.keys(changes).length > 0) {
          performanceData.changes = changes;
        }
      }

      // Save to Firestore
      await setDoc(doc(collection(db, "performanceInsights")), performanceData);

      setHasExistingData(true);
      
      // Show graph modal if there are changes
      if (previousData && Object.keys(changes).length > 0) {
        setUpdateChanges(changes);
        setShowGraphModal(true);
      } else {
        Alert.alert("Success", hasExistingData ? "Performance data updated successfully!" : "Performance data saved successfully!");
      }
    } catch (error) {
      console.error("Error saving performance data:", error);
      Alert.alert("Error", "Failed to save data: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateForm = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const getMetricDisplayName = (metric) => {
    const names = {
      matchesPlayed: "Matches Played",
      minutesPlayed: "Minutes Played",
      goalsScored: "Goals Scored",
      assists: "Assists",
      shotsOnTargetPercent: "Shots on Target %",
      passAccuracyPercent: "Pass Accuracy %",
      keyPasses: "Key Passes",
      dribblesCompleted: "Dribbles Completed",
      tacklesWon: "Tackles Won",
      interceptions: "Interceptions",
      duelsWonPercent: "Duels Won %",
      crossAccuracyPercent: "Cross Accuracy %",
      cleanSheets: "Clean Sheets",
      savesMade: "Saves Made",
      savePercent: "Save %",
      yellowCards: "Yellow Cards",
      redCards: "Red Cards",
    };
    return names[metric] || metric;
  };

  const renderUpdateGraph = () => {
    if (!updateChanges || Object.keys(updateChanges).length === 0) {
      return null;
    }

    const metrics = Object.keys(updateChanges);
    const colors = [
      "#0984e3",
      "#00b894",
      "#fdcb6e",
      "#e17055",
      "#6c5ce7",
      "#a29bfe",
      "#fd79a8",
      "#00cec9",
      "#55efc4",
      "#74b9ff",
      "#ffeaa7",
      "#fab1a0",
    ];

    // Prepare data: old and new values for each metric
    const dataPoints = metrics.map((metric) => ({
      metric,
      oldValue: updateChanges[metric].old,
      newValue: updateChanges[metric].new,
      color: colors[metrics.indexOf(metric) % colors.length],
    }));

    // Normalize values for display (0-100 scale or use actual range)
    const allValues = dataPoints.flatMap((dp) => [dp.oldValue, dp.newValue]);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = maxValue - minValue || 1;

    const normalizeValue = (value) => {
      return ((value - minValue) / range) * CHART_HEIGHT;
    };

    const barWidth = (CHART_WIDTH - PADDING * 2) / (metrics.length * 2 + metrics.length * 0.5);
    const spacing = barWidth * 0.5;

    return (
      <View style={styles.graphContainer}>
        <Text style={styles.graphTitle}>Performance Update Comparison</Text>
        <View style={styles.chartWrapper}>
          <Svg width={CHART_WIDTH + PADDING * 2} height={CHART_HEIGHT + PADDING * 2}>
            {/* Y-axis */}
            <Line
              x1={PADDING}
              y1={PADDING}
              x2={PADDING}
              y2={PADDING + CHART_HEIGHT}
              stroke="#2d3436"
              strokeWidth="2"
            />

            {/* X-axis */}
            <Line
              x1={PADDING}
              y1={PADDING + CHART_HEIGHT}
              x2={PADDING + CHART_WIDTH}
              y2={PADDING + CHART_HEIGHT}
              stroke="#2d3436"
              strokeWidth="2"
            />

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = PADDING + CHART_HEIGHT * (1 - ratio);
              const value = minValue + range * ratio;
              return (
                <G key={ratio}>
                  <Line
                    x1={PADDING}
                    y1={y}
                    x2={PADDING + CHART_WIDTH}
                    y2={y}
                    stroke="#e0e0e0"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <SvgText
                    x={PADDING - 10}
                    y={y + 5}
                    fontSize="10"
                    fill="#636e72"
                    textAnchor="end"
                  >
                    {value.toFixed(1)}
                  </SvgText>
                </G>
              );
            })}

            {/* Bars for old and new values */}
            {dataPoints.map((dp, index) => {
              const groupWidth = CHART_WIDTH / metrics.length;
              const x = PADDING + index * groupWidth + groupWidth / 2;
              const oldHeight = normalizeValue(dp.oldValue);
              const newHeight = normalizeValue(dp.newValue);
              const oldY = PADDING + CHART_HEIGHT - oldHeight;
              const newY = PADDING + CHART_HEIGHT - newHeight;
              const barSpacing = groupWidth * 0.15;
              const oldX = x - barSpacing;
              const newX = x + barSpacing;
              const barWidth = groupWidth * 0.25;

              return (
                <G key={dp.metric}>
                  {/* Old value bar */}
                  <Line
                    x1={oldX}
                    y1={PADDING + CHART_HEIGHT}
                    x2={oldX}
                    y2={oldY}
                    stroke={dp.color}
                    strokeWidth={barWidth}
                    strokeOpacity="0.6"
                  />
                  <Circle
                    cx={oldX}
                    cy={oldY}
                    r="6"
                    fill={dp.color}
                    opacity="0.6"
                  />
                  <SvgText
                    x={oldX}
                    y={oldY - 10}
                    fontSize="10"
                    fill="#2d3436"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {dp.oldValue.toFixed(1)}
                  </SvgText>

                  {/* Connection line */}
                  <Line
                    x1={oldX}
                    y1={oldY}
                    x2={newX}
                    y2={newY}
                    stroke={dp.color}
                    strokeWidth="2"
                    strokeDasharray="4,4"
                    opacity="0.5"
                  />

                  {/* New value bar */}
                  <Line
                    x1={newX}
                    y1={PADDING + CHART_HEIGHT}
                    x2={newX}
                    y2={newY}
                    stroke={dp.color}
                    strokeWidth={barWidth}
                  />
                  <Circle
                    cx={newX}
                    cy={newY}
                    r="6"
                    fill={dp.color}
                  />
                  <SvgText
                    x={newX}
                    y={newY - 10}
                    fontSize="10"
                    fill="#2d3436"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {dp.newValue.toFixed(1)}
                  </SvgText>

                  {/* Metric label */}
                  <SvgText
                    x={x}
                    y={PADDING + CHART_HEIGHT + 25}
                    fontSize="9"
                    fill="#636e72"
                    textAnchor="middle"
                    width={groupWidth * 0.8}
                  >
                    {getMetricDisplayName(dp.metric)}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColorOld, { backgroundColor: "#b2bec3" }]} />
            <Text style={styles.legendText}>Old Value</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColorNew, { backgroundColor: "#0984e3" }]} />
            <Text style={styles.legendText}>New Value</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoadingData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0984e3" />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Performance Insights</Text>
      {hasExistingData && (
        <Text style={styles.subtitle}>Update your performance statistics</Text>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <Text style={styles.label}>Season/Year *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 2023-24"
          value={form.seasonYear}
          onChangeText={(value) => updateForm("seasonYear", value)}
        />

        <Text style={styles.label}>Club/Team *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter club/team name"
          value={form.clubTeam}
          onChangeText={(value) => updateForm("clubTeam", value)}
        />

        <Text style={styles.label}>League/Tournament *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter league/tournament name"
          value={form.leagueTournament}
          onChangeText={(value) => updateForm("leagueTournament", value)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Match Statistics</Text>
        
        <Text style={styles.label}>Matches Played</Text>
        <TextInput
          style={styles.input}
          placeholder="Number"
          keyboardType="numeric"
          value={form.matchesPlayed}
          onChangeText={(value) => updateForm("matchesPlayed", value)}
        />

        <Text style={styles.label}>Minutes Played</Text>
        <TextInput
          style={styles.input}
          placeholder="Number"
          keyboardType="numeric"
          value={form.minutesPlayed}
          onChangeText={(value) => updateForm("minutesPlayed", value)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Attacking Statistics</Text>
        
        <Text style={styles.label}>Goals Scored</Text>
        <TextInput
          style={styles.input}
          placeholder="Number"
          keyboardType="numeric"
          value={form.goalsScored}
          onChangeText={(value) => updateForm("goalsScored", value)}
        />

        <Text style={styles.label}>Assists</Text>
        <TextInput
          style={styles.input}
          placeholder="Number"
          keyboardType="numeric"
          value={form.assists}
          onChangeText={(value) => updateForm("assists", value)}
        />

        <Text style={styles.label}>Shots on Target (%)</Text>
        <TextInput
          style={styles.input}
          placeholder="Percentage"
          keyboardType="numeric"
          value={form.shotsOnTargetPercent}
          onChangeText={(value) => updateForm("shotsOnTargetPercent", value)}
        />

        <Text style={styles.label}>Key Passes</Text>
        <TextInput
          style={styles.input}
          placeholder="Number"
          keyboardType="numeric"
          value={form.keyPasses}
          onChangeText={(value) => updateForm("keyPasses", value)}
        />

        <Text style={styles.label}>Dribbles Completed</Text>
        <TextInput
          style={styles.input}
          placeholder="Number"
          keyboardType="numeric"
          value={form.dribblesCompleted}
          onChangeText={(value) => updateForm("dribblesCompleted", value)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Defensive Statistics</Text>
        
        <Text style={styles.label}>Tackles Won</Text>
        <TextInput
          style={styles.input}
          placeholder="Number"
          keyboardType="numeric"
          value={form.tacklesWon}
          onChangeText={(value) => updateForm("tacklesWon", value)}
        />

        <Text style={styles.label}>Interceptions</Text>
        <TextInput
          style={styles.input}
          placeholder="Number"
          keyboardType="numeric"
          value={form.interceptions}
          onChangeText={(value) => updateForm("interceptions", value)}
        />

        <Text style={styles.label}>Duels Won (%)</Text>
        <TextInput
          style={styles.input}
          placeholder="Percentage"
          keyboardType="numeric"
          value={form.duelsWonPercent}
          onChangeText={(value) => updateForm("duelsWonPercent", value)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Passing & Crossing</Text>
        
        <Text style={styles.label}>Pass Accuracy (%)</Text>
        <TextInput
          style={styles.input}
          placeholder="Percentage"
          keyboardType="numeric"
          value={form.passAccuracyPercent}
          onChangeText={(value) => updateForm("passAccuracyPercent", value)}
        />

        <Text style={styles.label}>Cross Accuracy (%)</Text>
        <TextInput
          style={styles.input}
          placeholder="Percentage"
          keyboardType="numeric"
          value={form.crossAccuracyPercent}
          onChangeText={(value) => updateForm("crossAccuracyPercent", value)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Goalkeeper Statistics (GK only)</Text>
        
        <Text style={styles.label}>Clean Sheets</Text>
        <TextInput
          style={styles.input}
          placeholder="Number"
          keyboardType="numeric"
          value={form.cleanSheets}
          onChangeText={(value) => updateForm("cleanSheets", value)}
        />

        <Text style={styles.label}>Saves Made</Text>
        <TextInput
          style={styles.input}
          placeholder="Number"
          keyboardType="numeric"
          value={form.savesMade}
          onChangeText={(value) => updateForm("savesMade", value)}
        />

        <Text style={styles.label}>Save %</Text>
        <TextInput
          style={styles.input}
          placeholder="Percentage"
          keyboardType="numeric"
          value={form.savePercent}
          onChangeText={(value) => updateForm("savePercent", value)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Disciplinary</Text>
        
        <Text style={styles.label}>Yellow Cards</Text>
        <TextInput
          style={styles.input}
          placeholder="Number"
          keyboardType="numeric"
          value={form.yellowCards}
          onChangeText={(value) => updateForm("yellowCards", value)}
        />

        <Text style={styles.label}>Red Cards</Text>
        <TextInput
          style={styles.input}
          placeholder="Number"
          keyboardType="numeric"
          value={form.redCards}
          onChangeText={(value) => updateForm("redCards", value)}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitButtonText}>
            {hasExistingData ? "Update Performance Data" : "Save Performance Data"}
          </Text>
        )}
      </TouchableOpacity>

      {/* Graph Modal */}
      <Modal
        visible={showGraphModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowGraphModal(false);
          setUpdateChanges(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Performance Update</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowGraphModal(false);
                  setUpdateChanges(null);
                  Alert.alert("Success", "Performance data updated successfully!");
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {renderUpdateGraph()}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalOkButton}
              onPress={() => {
                setShowGraphModal(false);
                setUpdateChanges(null);
                Alert.alert("Success", "Performance data updated successfully!");
              }}
            >
              <Text style={styles.modalOkButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#636e72",
    marginBottom: 20,
    textAlign: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#636e72",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e8f4fd",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0984e3",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#2d3436",
  },
  submitButton: {
    backgroundColor: "#0984e3",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 800 : SCREEN_WIDTH - 40,
    maxHeight: "85%",
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#e8f4fd",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0984e3",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: "#636e72",
    fontWeight: "bold",
  },
  modalScrollView: {
    flex: 1,
    padding: 20,
  },
  graphContainer: {
    marginBottom: 20,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 16,
    textAlign: "center",
  },
  chartWrapper: {
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 15,
    marginBottom: 16,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColorOld: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    opacity: 0.6,
  },
  legendColorNew: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: "#636e72",
  },
  modalOkButton: {
    backgroundColor: "#0984e3",
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: "center",
  },
  modalOkButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default PerformanceInsightsScreen;

