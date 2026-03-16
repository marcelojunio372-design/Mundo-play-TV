import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function SubscriptionScreen({ navigation, session, onLogout }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.leftTitle}>| Subscription Info</Text>

      <View style={styles.card}>
        <Text style={styles.title}>Subscription Info</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Usuario:</Text>
          <Text style={styles.value}>{session.username}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Estado da conta:</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{session.accountStatus}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Vencimento:</Text>
          <Text style={styles.value}>{session.expirationDate}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Teste:</Text>
          <Text style={styles.value}>{session.isTrial}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Conexões ativas:</Text>
          <Text style={styles.value}>{session.activeConnections}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Criado em:</Text>
          <Text style={styles.value}>{session.createdAt}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Conexões máximas:</Text>
          <Text style={styles.value}>{session.maxConnections}</Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryText}>VOLTAR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={onLogout}>
          <Text style={styles.secondaryText}>SAIR</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#15103a",
    padding: 28,
  },
  leftTitle: {
    color: "#d7f6ff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#2b2456",
    borderRadius: 20,
    padding: 28,
  },
  title: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 30,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  label: {
    width: 320,
    color: "#dce7ff",
    fontSize: 18,
    fontWeight: "700",
  },
  value: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  badge: {
    backgroundColor: "#6bf0c9",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  buttons: {
    flexDirection: "row",
    marginTop: 24,
    gap: 16,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#67f4ff",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#31395b",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 20,
  },
  secondaryText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 20,
  },
});
