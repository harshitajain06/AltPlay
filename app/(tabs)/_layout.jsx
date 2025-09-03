// src/navigation/StackLayout.jsx

import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { View, ActivityIndicator, Alert } from "react-native";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

import AboutScreen from "./AboutScreen";
import ChatScreen from "./ChatScreen";
import AdminScreen from "./AdminScreen";
import FormScreen from "./FormScreen";
import InvestmentScreen from "./InvestmentScreen";
import InvestorScreen from "./InvestorsScreen";
import PlayerScreen from "./PlayerScreen";
import ProfileScreen from "./ProfileScreen";
import LoginRegister from "./index";

import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";
import { auth } from "../../config/firebase";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const db = getFirestore();

/* ---------------------- Player Tabs ---------------------- */
const PlayerTabs = () => {
  const colorScheme = useColorScheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "About") {
            iconName = focused ? "information-circle" : "information-circle-outline";
          } 
          // else if (route.name === "Chat") {
          //   iconName = focused ? "chatbubble" : "chatbubble-outline";
          // } 
          else if (route.name === "Investor") {
            iconName = focused ? "people" : "people-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="About" component={AboutScreen} />
      {/* <Tab.Screen name="Chat" component={ChatScreen} /> */}
      <Tab.Screen name="Investor" component={InvestorScreen} />
    </Tab.Navigator>
  );
};

/* ---------------------- Investor Tabs ---------------------- */
const InvestorTabs = () => {
  const colorScheme = useColorScheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Players") {
            iconName = focused ? "game-controller" : "game-controller-outline";
          } else if (route.name === "Investment") {
            iconName = focused ? "cash" : "cash-outline";
          } 
          // else if (route.name === "Chat") {
          //   iconName = focused ? "chatbubble" : "chatbubble-outline";
          // }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Players" component={PlayerScreen} />
      <Tab.Screen name="Investment" component={InvestmentScreen} />
      {/* <Tab.Screen name="Chat" component={ChatScreen} /> */}
    </Tab.Navigator>
  );
};

/* ---------------------- Admin Tabs ---------------------- */
const AdminTabs = () => {
  const colorScheme = useColorScheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "AdminDashboard") {
            iconName = focused ? "settings" : "settings-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="AdminDashboard" component={AdminScreen} />
    </Tab.Navigator>
  );
};

/* ---------------------- Drawer Navigator ---------------------- */
const DrawerNavigator = ({ role }) => {
  const navigation = useNavigation();

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.replace("LoginRegister");
      })
      .catch((err) => {
        console.error("Logout Error:", err);
        Alert.alert("Error", "Failed to logout. Please try again.");
      });
  };

  // Decide which tabs to render based on role
  const getMainTabs = () => {
    if (role === "player") return PlayerTabs;
    if (role === "investor") return InvestorTabs;
    if (role === "admin") return AdminTabs;
    return PlayerTabs; // fallback
  };

  return (
    <Drawer.Navigator initialRouteName="MainTabs">
      <Drawer.Screen
        name="MainTabs"
        component={getMainTabs()}
        options={{ title: "Home" }}
      />

      {/* ✅ PlayerForm accessible via drawer */}
      <Drawer.Screen
        name="PlayerForm"
        component={FormScreen}
        options={{
          title: "Player Registration",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="create-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Logout"
        component={View} // dummy component
        options={{
          title: "Logout",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="log-out-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          drawerItemPress: (e) => {
            e.preventDefault();
            handleLogout();
          },
        }}
      />
    </Drawer.Navigator>
  );
};

/* ---------------------- Main Stack Layout ---------------------- */
export default function StackLayout() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setRole(docSnap.data().role);
          } else {
            setRole(null);
          }
        } catch (error) {
          console.error("Error fetching role:", error);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
        },
      }}
    >
      {user ? (
        <Stack.Screen name="Drawer">
          {() => <DrawerNavigator role={role} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="LoginRegister" component={LoginRegister} />
      )}
    </Stack.Navigator>
  );
}
