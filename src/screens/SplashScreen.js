import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Audio } from "expo-av";

const { width } = Dimensions.get("window");

export default function SplashScreen({ navigation }) {
  const lineTranslate = useRef(new Animated.Value(-width)).current;
  const lineOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const [showLogo, setShowLogo] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function startIntro() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../../assets/sounds/start.mp3")
        );
        soundRef.current = sound;
        await sound.playAsync();
      } catch (e) {
        console.log("Erro ao tocar som:", e);
      }

      Animated.parallel([
        Animated.timing(lineTranslate, {
          toValue: width,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(1400),
          Animated.timing(lineOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      setTimeout(() => {
        if (!mounted) return;
        setShowLogo(true);

        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      }, 1700);

      setTimeout(async () => {
        if (!mounted) return;
        try {
          if (soundRef.current) {
            await soundRef.current.unloadAsync();
          }
        } catch {}
        navigation.replace("Login");
      }, 3400);
    }

    startIntro();

    return () => {
      mounted = false;
      try {
        if (soundRef.current) {
          soundRef.current.unloadAsync();
        }
      } catch {}
    };
  }, [lineTranslate, lineOpacity, logoOpacity, logoScale, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.blackBg} />

      <Animated.View
        style={[
          styles.energyLine,
          {
            opacity: lineOpacity,
            transform: [{ translateX: lineTranslate }, { rotate: "-8deg" }],
          },
        ]}
      />

      {showLogo ? (
        <Animated.Image
          source={require("../../assets/logo.png")}
          resizeMode="contain"
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  blackBg: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
  },

  energyLine: {
    position: "absolute",
    width: width * 1.4,
    height: 10,
    backgroundColor: "#d8b4fe",
    borderRadius: 999,
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 12,
  },

  logo: {
    width: 240,
    height: 240,
  },
});
