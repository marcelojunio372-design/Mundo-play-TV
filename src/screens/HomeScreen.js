import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";

export default function HomeScreen({ navigation, session }) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const date = now.toLocaleDateString("pt-BR");
      setClock(`${time}  ${date}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    {
      id: "live",
      title: "Live TV",
      subtitle: "Canais ao vivo por categoria",
      onPress: () => navigation.navigate("LiveTV"),
    },
    {
      id: "movies",
      title: "Filmes",
      subtitle: "Carrega só filmes quando entrar",
      onPress: () => navigation.navigate("Movies"),
    },
    {
      id: "series",
      title: "Séries",
      subtitle: "Carrega só séries quando entrar",
      onPress: () => navigation.navigate("Series"),
    },
    {
      id: "sub",
      title: "Subscription Info",
      subtitle: "Validade e dados da conta",
      onPress: () => navigation.navigate("Subscription"),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>EPIC</Text>
        <Text style={styles.clock}>{clock}</Text>
      </View>

      <View style={styles.grid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={item.onPress}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footerBox}>
        <Text style={styles.footerTitle}>Usuário: {session.username}</Text>
        <Text style={styles.footerText}>Status: {session.accountStatus}</Text>
        <Text style={styles.footerText}>Vencimento: {session.expirationDate}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#15103a",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  logo: {
    color: "#85f8ff",
    fontSize: 24,
    fontWeight: "900",
  },
  clock: {
    color: "#d9f7ff",
    fontSize: 22,
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  card: {
    width: "48%",
    minHeight: 180,
    borderRadius: 20,
    backgroundColor: "#66f2ff",
    padding: 22,
    justifyContent: "flex-end",
  },
  cardTitle: {
    color: "#12427b",
    fontSize: 30,
    fontWeight: "900",
  },
  cardSubtitle: {
    color: "#2c5d8e",
    fontSize: 16,
    marginTop: 10,
  },
  footerBox: {
    marginTop: 28,
    backgroundColor: "#1d1646",
    borderRadius: 18,
    padding: 18,
  },
  footerTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  footerText: {
    color: "#c9d8ff",
    fontSize: 15,
    marginTop: 6,
  },
});
