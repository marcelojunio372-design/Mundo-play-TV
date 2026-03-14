import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import {
  formatUnixDate,
  getAccountExpiryText,
  getAccountStatusText,
} from "../utils/iptv";

export default function SubscriptionInfoScreen({ route, navigation }) {
  const params = route?.params || {};
  const authData = params?.authData || {};
  const username = params?.username || "";
  const loginType = params?.loginType || "xtream";

  const userInfo = authData?.user_info || {};
  const status = getAccountStatusText(authData);
  const expiry = getAccountExpiryText(authData);
  const isTrial =
    userInfo?.is_trial === "1" || userInfo?.is_trial === 1 ? "Sim" : "Não";
  const activeCons = userInfo?.active_cons ?? "0";
  const maxConnections = userInfo?.max_connections ?? "0";
  const createdAt = formatUnixDate(userInfo?.created_at);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.header}>Subscription Info</Text>

        <View style={styles.card}>
          {loginType === "xtream" ? (
            <>
              <InfoRow label="Usuário:" value={username || "Não informado"} />
              <InfoRow label="Estado da conta:" value={status} highlight={status === "Ativa"} />
              <InfoRow label="Vencimento:" value={expiry} />
              <InfoRow label="Teste:" value={isTrial} />
              <InfoRow label="Conexões ativas:" value={String(activeCons)} />
              <InfoRow label="Criado em:" value={createdAt} />
              <InfoRow label="Conexões máximas:" value={String(maxConnections)} />
            </>
          ) : (
            <>
              <InfoRow label="Tipo:" value="Lista M3U" />
              <InfoRow label="Estado da conta:" value="Não disponível em M3U" />
              <InfoRow label="Vencimento:" value="Não disponível em M3U" />
            </>
          )}
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>VOLTAR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.replace("Login")}>
            <Text style={styles.secondaryBtnText}>SAIR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, highlight = false }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {highlight ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{value}</Text>
        </View>
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#12031f",
  },
  container: {
    flex: 1,
    padding: 18,
    justifyContent: "center",
  },
  header: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22,
    padding: 22,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  label: {
    width: "46%",
    color: "#d8d8d8",
    fontSize: 18,
    fontWeight: "700",
  },
  value: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  badge: {
    backgroundColor: "#18e7a1",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: {
    color: "#111",
    fontWeight: "900",
    fontSize: 16,
  },
  buttons: {
    flexDirection: "row",
    marginTop: 22,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#18e7a1",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginRight: 10,
  },
  primaryBtnText: {
    color: "#111",
    fontWeight: "900",
    fontSize: 18,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
  },
});
