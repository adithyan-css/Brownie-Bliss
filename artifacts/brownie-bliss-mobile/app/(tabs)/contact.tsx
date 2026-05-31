import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Linking } from "react-native";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const CONTACT_INFO = [
  {
    icon: "map-pin",
    label: "Visit Us",
    value: "Krishnagiri, Tamil Nadu",
  },
  {
    icon: "phone",
    label: "Call Us",
    value: "+91 8072596340",
    onPress: () => Linking.openURL("tel:+918072596340"),
  },
  {
    icon: "instagram",
    label: "Instagram",
    value: "@browniebliss.in",
    onPress: () => Linking.openURL("https://www.instagram.com/browniebliss.in"),
  },
];

export default function ContactScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSend = () => {
    if (!name.trim() || !message.trim()) {
      Alert.alert("Missing Info", "Please enter your name and message.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const waMsg = `Hello Brownie Bliss!\n\nName: ${name}\nEmail: ${email}\n\nMessage: ${message}`;
    Linking.openURL(`https://wa.me/918072596340?text=${encodeURIComponent(waMsg)}`);
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <Text style={[styles.headerTitle, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>
          Contact Us
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero text */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            Let's Make Life{"\n"}
            <Text style={{ color: colors.accent }}>Sweeter Together</Text>
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Have a custom order, celebration idea or dessert request? We'd love to bake happiness for you.
          </Text>
        </View>

        {/* Contact info cards */}
        {CONTACT_INFO.map((item) => (
          <Pressable
            key={item.label}
            onPress={item.onPress}
            style={[
              styles.infoCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.infoIcon, { backgroundColor: colors.primary }]}>
              {/* @ts-ignore */}
              <Feather name={item.icon as any} size={20} color={colors.accent} />
            </View>
            <View style={styles.infoText}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {item.label}
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                {item.value}
              </Text>
            </View>
            {item.onPress && (
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            )}
          </Pressable>
        ))}

        {/* Message form */}
        <View style={[styles.formCard, { backgroundColor: colors.primary }]}>
          <Text style={[styles.formTitle, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>
            Send us a Message
          </Text>

          <TextInput
            placeholder="Your Name"
            placeholderTextColor="rgba(244,228,188,0.5)"
            value={name}
            onChangeText={setName}
            style={[styles.input, { borderColor: "rgba(212,175,55,0.3)", color: "#FFF9F2", fontFamily: "Inter_400Regular" }]}
          />
          <TextInput
            placeholder="Your Email"
            placeholderTextColor="rgba(244,228,188,0.5)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { borderColor: "rgba(212,175,55,0.3)", color: "#FFF9F2", fontFamily: "Inter_400Regular" }]}
          />
          <TextInput
            placeholder="Tell us about your order..."
            placeholderTextColor="rgba(244,228,188,0.5)"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            style={[styles.textarea, { borderColor: "rgba(212,175,55,0.3)", color: "#FFF9F2", fontFamily: "Inter_400Regular" }]}
          />

          <Pressable
            onPress={handleSend}
            style={[styles.sendBtn, { backgroundColor: colors.accent }]}
          >
            <Feather name="send" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.sendBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              Send via WhatsApp
            </Text>
          </Pressable>
        </View>

        {/* Baking hours */}
        <View style={[styles.hoursCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="clock" size={18} color={colors.primary} style={{ marginRight: 10 }} />
          <View>
            <Text style={[styles.hoursTitle, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              Baking Hours
            </Text>
            <Text style={[styles.hoursText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Mon–Sat: 8AM – 8PM{"\n"}Sunday: 10AM – 6PM
            </Text>
          </View>
        </View>

        <View style={{ height: Platform.OS === "web" ? 100 : 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 22 },
  content: { padding: 16, gap: 16 },
  hero: { paddingVertical: 8 },
  heroTitle: { fontSize: 28, lineHeight: 36, marginBottom: 10 },
  heroSub: { fontSize: 14, lineHeight: 22 },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, marginBottom: 2 },
  infoValue: { fontSize: 15 },
  formCard: {
    borderRadius: 20,
    padding: 24,
    gap: 14,
  },
  formTitle: { fontSize: 18, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "rgba(255,249,242,0.1)",
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "rgba(255,249,242,0.1)",
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  sendBtnText: { fontSize: 16 },
  hoursCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  hoursTitle: { fontSize: 15, marginBottom: 4 },
  hoursText: { fontSize: 13, lineHeight: 20 },
});
