import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";
import { placeOrder } from "@/lib/api";

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { items, removeItem, updateQty, clearCart, total, count } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [placing, setPlacing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handlePlaceOrder = async () => {
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
      Alert.alert("Missing Info", "Please fill in all delivery details.");
      return;
    }
    if (phone.length !== 10) {
      Alert.alert("Invalid Phone", "Please enter a 10-digit phone number.");
      return;
    }

    setPlacing(true);
    const result = await placeOrder({
      customer_name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      total,
    });
    setPlacing(false);

    if (!result) {
      Alert.alert("Order Failed", "Could not place order. Please try again.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const itemLines = items
      .map((i) => `• ${i.name} × ${i.qty} = ₹${i.price * i.qty}`)
      .join("\n");
    const waMsg =
      `🍫 *New Order — Brownie Bliss*\n\n` +
      `📋 *Order ID:* ${result.orderId}\n` +
      `👤 *Customer:* ${name}\n` +
      `📱 *Phone:* +91 ${phone}\n` +
      `📍 *Address:* ${address}, ${city} - ${pincode}\n\n` +
      `🛒 *Items:*\n${itemLines}\n\n` +
      `💰 *Total: ₹${total}*\n\n` +
      `_Please share payment receipt for confirmation!_ ✨`;

    clearCart();
    router.back();
    Linking.openURL(`https://wa.me/918072596340?text=${encodeURIComponent(waMsg)}`);
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  if (count === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Feather name="shopping-bag" size={64} color={colors.border} />
        <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          Your cart is empty
        </Text>
        <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Add some treats from the menu
        </Text>
        <Pressable
          onPress={() => { router.back(); router.push("/(tabs)/menu"); }}
          style={[styles.browseBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.browseBtnText, { fontFamily: "Inter_600SemiBold" }]}>
            Browse Menu
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image source={{ uri: item.img }} style={styles.itemImage} resizeMode="cover" />
            <View style={styles.itemBody}>
              <Text style={[styles.itemName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                ₹{item.price * item.qty}
              </Text>
              <View style={styles.qtyRow}>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); updateQty(item._id, item.qty - 1); }}
                  style={[styles.qtyBtn, { backgroundColor: colors.secondary }]}
                >
                  <Feather name="minus" size={14} color={colors.primary} />
                </Pressable>
                <Text style={[styles.qtyText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {item.qty}
                </Text>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); updateQty(item._id, item.qty + 1); }}
                  style={[styles.qtyBtn, { backgroundColor: colors.secondary }]}
                >
                  <Feather name="plus" size={14} color={colors.primary} />
                </Pressable>
              </View>
            </View>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); removeItem(item._id); }}>
              <Feather name="trash-2" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          <>
            {/* Summary */}
            <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Items ({count})
                </Text>
                <Text style={[styles.summaryValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  ₹{total}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  Total
                </Text>
                <Text style={[styles.totalValue, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                  ₹{total}
                </Text>
              </View>
            </View>

            {/* Checkout toggle */}
            <Pressable
              onPress={() => setShowForm(!showForm)}
              style={[styles.checkoutToggle, { backgroundColor: showForm ? colors.secondary : colors.primary }]}
            >
              <Text style={[styles.checkoutToggleText, { color: showForm ? colors.primary : "#FFF9F2", fontFamily: "Inter_600SemiBold" }]}>
                {showForm ? "Hide Details" : "Proceed to Checkout"}
              </Text>
              <Feather
                name={showForm ? "chevron-up" : "chevron-down"}
                size={18}
                color={showForm ? colors.primary : "#FFF9F2"}
              />
            </Pressable>

            {/* Delivery form */}
            {showForm && (
              <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.formTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  Delivery Details
                </Text>

                {[
                  { label: "Full Name", value: name, setter: setName, placeholder: "Your name", keyboard: "default" as const },
                  { label: "Phone Number", value: phone, setter: setPhone, placeholder: "10-digit number", keyboard: "phone-pad" as const },
                  { label: "Address", value: address, setter: setAddress, placeholder: "Street & house number", keyboard: "default" as const },
                  { label: "City", value: city, setter: setCity, placeholder: "City", keyboard: "default" as const },
                  { label: "Pincode", value: pincode, setter: setPincode, placeholder: "6-digit pincode", keyboard: "numeric" as const },
                ].map((field) => (
                  <View key={field.label} style={styles.field}>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {field.label}
                    </Text>
                    <TextInput
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.mutedForeground}
                      value={field.value}
                      onChangeText={field.setter}
                      keyboardType={field.keyboard}
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.input,
                          borderColor: colors.border,
                          color: colors.foreground,
                          fontFamily: "Inter_400Regular",
                        },
                      ]}
                    />
                  </View>
                ))}

                <Pressable
                  onPress={handlePlaceOrder}
                  disabled={placing}
                  style={[styles.placeBtn, { backgroundColor: colors.primary, opacity: placing ? 0.7 : 1 }]}
                >
                  {placing ? (
                    <ActivityIndicator color="#FFF9F2" />
                  ) : (
                    <>
                      <Feather name="message-circle" size={18} color={colors.accent} style={{ marginRight: 10 }} />
                      <Text style={[styles.placeBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                        Place Order via WhatsApp
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}

            <View style={{ height: bottomPad }} />
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontSize: 20 },
  emptySub: { fontSize: 14 },
  browseBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  browseBtnText: { fontSize: 15, color: "#FFF9F2" },
  list: { padding: 16, gap: 12 },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    marginBottom: 12,
  },
  itemImage: { width: 80, height: 80, borderRadius: 12 },
  itemBody: { flex: 1, gap: 6 },
  itemName: { fontSize: 14, lineHeight: 20 },
  itemPrice: { fontSize: 16 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: { fontSize: 16, minWidth: 20, textAlign: "center" },
  summary: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14 },
  divider: { height: 1, marginVertical: 12 },
  totalLabel: { fontSize: 17 },
  totalValue: { fontSize: 20 },
  checkoutToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
  },
  checkoutToggleText: { fontSize: 16 },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  formTitle: { fontSize: 18 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  placeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  placeBtnText: { fontSize: 16, color: "#FFF9F2" },
});
