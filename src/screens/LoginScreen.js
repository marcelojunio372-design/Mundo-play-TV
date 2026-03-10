import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";

const { width: W, height: H } = Dimensions.get("window");

function normalizeUrl(u) {
  const s = (u || "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return "http://" + s;
}

function extractXtreamFromM3U(url) {
  try {
    const u = new URL(url);
    const username = u.searchParams.get("username") || "";
    const password = u.searchParams.get("password") || "";
    const server = `${u.protocol}//${u.host}`;
    return { server, username, password };
  } catch {
    return { server: "", username: "", password: "" };
  }
}

export default function LoginScreen({ navigation }) {
  const [tab, setTab] = useState("m3u");
  const [m3uUrl, setM3uUrl] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [deviceId, setDeviceId] = useState("CARREGANDO...");

  const cardMaxWidth = useMemo(() => Math.min(W * 0.92, 430), []);

  useEffect(() => {
    (async () => {
      try {
        const savedM3U = await AsyncStorage.getItem("m3u_url");
        const savedServer = await AsyncStorage.getItem("xtream_server");
        const savedUser = await AsyncStorage.getItem("xtream_user");
        const savedPass = await AsyncStorage.getItem("xtream_pass");

        if (savedM3U) setM3uUrl(savedM3U);
        if (savedServer) setServerUrl(savedServer);
        if (savedUser) setUser(savedUser);
        if (savedPass) setPass(savedPass);

        const id = await Application.getAndroidId();
        if (id) setDeviceId(String(id).toUpperCase());
      } catch {
        setDeviceId("INDISPONÍVEL");
      }
    })();
  }, []);

  async function verifyConnection() {
    try {
      if (tab === "m3u") {
        const url = normalizeUrl(m3uUrl);
        if (!url) {
          return Alert.alert("Erro", "Informe a URL M3U.");
        }

        await AsyncStorage.multiSet([
          ["login_mode", "m3u"],
          ["m3u_url", url],
        ]);

        return Alert.alert("OK", "Lista salva com sucesso.");
      }

      if (tab === "user") {
        const s = normalizeUrl(serverUrl);

        if (!s) {
          return Alert.alert("Erro", "Informe o servidor.");
        }

        if (!user.trim() || !pass.trim()) {
          return Alert.alert("Erro", "Informe usuário e senha.");
        }

        await AsyncStorage.multiSet([
          ["login_mode", "xtream"],
          ["xtream_server", s],
          ["xtream_user", user.trim()],
          ["xtream_pass", pass.trim()],
        ]);

        return Alert.alert("OK", "Login salvo com sucesso.");
      }
    } catch (e) {
      Alert.alert("Erro", String(e?.message || e));
    }
  }

  async function enterApp() {
    try {
      if (tab === "m3u") {
        const url = normalizeUrl(m3uUrl);
        if (!url) {
          return Alert.alert("Erro", "Informe a URL M3U.");
        }

        await AsyncStorage.setItem("m3u_url", url);

        const xt = extractXtreamFromM3U(url);
        const isXtream = !!(xt.server && xt.username && xt.password);

        if (isXtream) {
          await AsyncStorage.multiSet([
            ["login_mode", "xtream"],
            ["xtream_server", xt.server],
            ["xtream_user", xt.username],
            ["xtream_pass", xt.password],
          ]);
        } else {
          await AsyncStorage.setItem("login_mode", "m3u");
        }

        navigation.replace("Home");
        return;
      }

      if (tab === "user") {
        const s = normalizeUrl(serverUrl);

        if (!s) {
          return Alert.alert("Erro", "Informe o servidor.");
        }

        if (!user.trim() || !pass.trim()) {
          return Alert.alert("Erro", "Informe usuário e senha.");
        }

        await AsyncStorage.multiSet([
          ["login_mode", "xtream"],
          ["xtream_server", s],
          ["xtream_user", user.trim()],
          ["xtream_pass", pass.trim()],
        ]);

        navigation.replace("Home");
      }
    } catch (e) {
      Alert.alert("Erro", String(e?.message || e));
    }
  }

  return (
    <View style={styles.root}>
      <Image
        source={require("../../assets/bg.jpg")}
        style={styles.bg}
        resizeMode="cover"
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={[styles.card, { maxWidth: cardMaxWidth }]}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.tabs}>
            <TouchableOpacity
              onPress={() => setTab("m3u")}
              style={[styles.tabBtn, tab === "m3u" && styles.tabBtnActive]}
            >
              <Text style={styles.tabText}>M3U</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTab("user")}
              style={[styles.tabBtn, tab === "user" && styles.tabBtnActive]}
            >
              <Text style={styles.tabText}>Usuário</Text>
            </TouchableOpacity>
          </View>

          {tab === "m3u" && (
            <>
              <TextInput
                style={styles.input}
                placeholder="URL da lista M3U"
                placeholderTextColor="#bbb"
                value={m3uUrl}
                onChangeText={setM3uUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.hint}>Aceita links em http:// e https://</Text>
            </>
          )}

          {tab === "user" && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Servidor (http:// ou https://)"
                placeholderTextColor="#bbb"
                value={serverUrl}
                onChangeText={setServerUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={styles.input}
                placeholder="Usuário"
                placeholderTextColor="#bbb"
                value={user}
                onChangeText={setUser}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#bbb"
                value={pass}
                onChangeText={setPass}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.hint}>
                Funciona com servidor em http:// e https://
              </Text>
            </>
          )}

          <View style={styles.row}>
            <TouchableOpacity style={styles.btnSecondary} onPress={verifyConnection}>
              <Text style={styles.btnSecondaryText}>VERIFICAR</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnPrimary} onPress={enterApp}>
              <Text style={styles.btnPrimaryText}>ENTRAR</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.macFooter}>MAC: {deviceId}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },

  bg: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.95,
  },

  scroll: {
    minHeight: H,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.46)",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  logo: {
    width: "100%",
    height: 110,
    marginBottom: 6,
  },

  tabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },

  tabBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
  },

  tabBtnActive: {
    backgroundColor: "rgba(255,255,255,0.24)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },

  tabText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  input: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "android" ? 10 : 12,
    fontSize: 15,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginTop: 8,
  },

  hint: {
    color: "rgba(255,255,255,0.70)",
    marginTop: 6,
    fontSize: 12,
  },

  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },

  btnSecondary: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },

  btnSecondaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  btnPrimary: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },

  btnPrimaryText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "800",
  },

  footerRow: {
    marginTop: 10,
    alignItems: "flex-start",
  },

  macFooter: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 12,
    fontWeight: "600",
  },
});
