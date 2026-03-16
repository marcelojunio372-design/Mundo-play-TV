import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { MOCK_USER } from "../data/mockData";

export default function LoginScreen({ onLoginSuccess }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoRow}>
        <Text style={styles.logo}>EPIC</Text>
      </View>

      <Text style={styles.title}>LISTAR USUÁRIOS</Text>

      <TouchableOpacity
        style={styles.userBox}
        onPress={() => onLoginSuccess(MOCK_USER)}
      >
        <Text style={styles.userName}>Epic Smart</Text>
        <Text style={styles.userSubtitle}>
          Nome de usuario  {MOCK_USER.username}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#120d35",
    padding: 28,
  },
  logoRow: {
    marginBottom: 30,
  },
  logo: {
    color: "#7fe9ff",
    fontSize: 26,
    fontWeight: "900",
  },
  title: {
    color: "#d9f6ff",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 40,
  },
  userBox: {
    width: "60%",
    minWidth: 500,
    backgroundColor: "#dcefff",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: "#8cf4ff",
    shadowColor: "#6cf5ff",
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  userName: {
    color: "#11316e",
    fontSize: 28,
    fontWeight: "800",
  },
  userSubtitle: {
    color: "#3b4f88",
    fontSize: 18,
    marginTop: 6,
  },
});
