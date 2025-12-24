import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRoute } from "@react-navigation/native";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { Svg, Polyline, Line, Circle, Text as SvgText, G } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 80;
const CHART_HEIGHT = 200;
const PADDING = 40;

const PerformanceGraphScreen = () => {
  const [user, loading] = useAuthState(auth);
  const route = useRoute();
  const [isLoading, setIsLoading] = useState(true);
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  
  // Get playerId from route params if provided, otherwise use current user's uid
  const targetUserId = route.params?.playerId || user?.uid;
  const playerName = route.params?.playerName || null;

  useEffect(() => {
    const loadPerformanceHistory = async () => {
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        let performanceQuery;
        try {
          // Try with orderBy first
          performanceQuery = query(
            collection(db, "performanceInsights"),
            where("userId", "==", targetUserId),
            orderBy("createdAt", "desc")
          );
        } catch (error) {
          // If orderBy fails (missing index), use query without orderBy
          console.log("orderBy failed, using simple query:", error);
          performanceQuery = query(
            collection(db, "performanceInsights"),
            where("userId", "==", targetUserId)
          );
        }
        
        const querySnapshot = await getDocs(performanceQuery);

        const history = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          history.push({
            id: doc.id,
            ...data,
            timestamp: data.createdAt?.toMillis() || data.updatedAt?.toMillis() || Date.now(),
          });
        });

        // Sort by timestamp ascending for chart (always sort in JS as fallback)
        history.sort((a, b) => a.timestamp - b.timestamp);
        setPerformanceHistory(history);

        // Extract metrics that have values across multiple entries
        if (history.length > 1) {
          const metrics = new Set();
          const numericFields = [
            "matchesPlayed", "minutesPlayed", "goalsScored", "assists",
            "shotsOnTargetPercent", "passAccuracyPercent", "keyPasses",
            "dribblesCompleted", "tacklesWon", "interceptions",
            "duelsWonPercent", "crossAccuracyPercent", "cleanSheets",
            "savesMade", "savePercent", "yellowCards", "redCards"
          ];

          // Find metrics that have values in at least 2 entries
          numericFields.forEach((field) => {
            const entriesWithValue = history.filter(
              (entry) => entry[field] !== null && entry[field] !== undefined
            );
            if (entriesWithValue.length >= 2) {
              metrics.add(field);
            }
          });

          setSelectedMetrics(Array.from(metrics));
        }
      } catch (error) {
        console.error("Error loading performance history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceHistory();
  }, [targetUserId]);

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

  const renderChart = (metric) => {
    if (performanceHistory.length < 2) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            Need at least 2 data points to show progress
          </Text>
        </View>
      );
    }

    // Extract values and timestamps for this metric, only including changed values
    const dataPoints = [];
    let previousValue = null;

    performanceHistory.forEach((entry) => {
      // Get the current value for this metric
      let currentValue = null;
      
      // Check if this entry has a change record for this metric
      if (entry.changes && entry.changes[metric]) {
        currentValue = entry.changes[metric].new;
      } else if (entry[metric] !== null && entry[metric] !== undefined) {
        currentValue = entry[metric];
      }

      // Only add data point if value exists and is different from previous
      if (currentValue !== null && currentValue !== undefined) {
        if (previousValue === null || currentValue !== previousValue) {
          dataPoints.push({
            value: currentValue,
            timestamp: entry.timestamp,
            entry: entry,
          });
          previousValue = currentValue;
        }
      }
    });

    if (dataPoints.length < 2) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            Not enough changes detected for {getMetricDisplayName(metric)}
          </Text>
        </View>
      );
    }

    const values = dataPoints.map((dp) => dp.value);

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    const stepX = CHART_WIDTH / (dataPoints.length - 1);
    const stepY = CHART_HEIGHT / range;

    const points = dataPoints
      .map((dp, index) => {
        const x = PADDING + index * stepX;
        const y = PADDING + CHART_HEIGHT - (dp.value - minValue) * stepY;
        return `${x},${y}`;
      })
      .join(" ");

    const colors = [
      "#0984e3",
      "#00b894",
      "#fdcb6e",
      "#e17055",
      "#6c5ce7",
      "#a29bfe",
      "#fd79a8",
      "#00cec9",
    ];
    const colorIndex = selectedMetrics.indexOf(metric) % colors.length;
    const color = colors[colorIndex];

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{getMetricDisplayName(metric)}</Text>
        <View style={styles.chartWrapper}>
          <Svg width={CHART_WIDTH + PADDING * 2} height={CHART_HEIGHT + PADDING * 2}>
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

            {/* Chart line */}
            <Polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {dataPoints.map((dp, index) => {
              const x = PADDING + index * stepX;
              const y = PADDING + CHART_HEIGHT - (dp.value - minValue) * stepY;
              return (
                <G key={index}>
                  <Circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill={color}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <SvgText
                    x={x}
                    y={y - 10}
                    fontSize="10"
                    fill="#2d3436"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {dp.value.toFixed(1)}
                  </SvgText>
                </G>
              );
            })}

            {/* X-axis labels */}
            {dataPoints.map((dp, index) => {
              if (index % Math.ceil(dataPoints.length / 4) === 0 || index === dataPoints.length - 1) {
                const x = PADDING + index * stepX;
                const date = new Date(dp.timestamp);
                const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                return (
                  <SvgText
                    key={index}
                    x={x}
                    y={CHART_HEIGHT + PADDING + 20}
                    fontSize="10"
                    fill="#636e72"
                    textAnchor="middle"
                  >
                    {dateStr}
                  </SvgText>
                );
              }
              return null;
            })}
          </Svg>
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: color }]} />
            <Text style={styles.legendText}>
              Min: {minValue.toFixed(1)} | Max: {maxValue.toFixed(1)} | 
              Latest: {values[values.length - 1].toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0984e3" />
        <Text style={styles.loadingText}>Loading performance data...</Text>
      </View>
    );
  }

  if (performanceHistory.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.emptyText}>No performance data found</Text>
        <Text style={styles.emptySubtext}>
          Fill in your performance insights to see your progress graph
        </Text>
      </View>
    );
  }

  if (performanceHistory.length < 2) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.emptyText}>Not enough data for graphs</Text>
        <Text style={styles.emptySubtext}>
          Update your performance insights at least once to see progress graphs
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Performance Graph</Text>
      {playerName ? (
        <Text style={styles.subtitle}>
          Performance progress for {playerName}
        </Text>
      ) : (
        <Text style={styles.subtitle}>
          Track your progress across different metrics
        </Text>
      )}

      {selectedMetrics.length === 0 ? (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            No changes detected. Update your performance data to see progress graphs.
          </Text>
        </View>
      ) : (
        selectedMetrics.map((metric) => (
          <View key={metric} style={styles.metricCard}>
            {renderChart(metric)}
          </View>
        ))
      )}
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
    marginBottom: 24,
    textAlign: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#636e72",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#636e72",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  metricCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#0984e3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e8f4fd",
  },
  chartContainer: {
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0984e3",
    marginBottom: 16,
  },
  chartWrapper: {
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 10,
  },
  chartLegend: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: "#636e72",
  },
  noDataContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 14,
    color: "#636e72",
    textAlign: "center",
  },
});

export default PerformanceGraphScreen;

