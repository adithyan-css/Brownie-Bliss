import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { trackOrder, Order } from "@/lib/api";

const STATUS_STEPS = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Order Received",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};
const STATUS_ICONS: Record<string, string> = {
  pending: "clock",
  confirmed: "check-circle",
  preparing: "loader",
  out_for_delivery: "truck",
  delivered: "package",
};

export default function TrackScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleTrack = async () => {
    if (!orderId.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError("");
    setOrder(null);
    const result = await trackOrder(orderId.trim());
    setLoading(false);
    if (!result) {
      setError("Order not found. Please check your order ID.");
    } else {
      setOrder(result);
    }
  };

  const stepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <Text style={[styles.headerTitle, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>
          Track Order
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search box */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Enter your Order ID
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            You received this in your WhatsApp confirmation
          </Text>
          <TextInput
            placeholder="e.g. BB-1234567"
            placeholderTextColor={colors.mutedForeground}
            value={orderId}
            onChangeText={setOrderId}
            autoCapitalize="characters"
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                color: colors.foreground,
                borderColor: colors.border,
                fontFamily: "Inter_400Regular",
              },
            ]}
          />
          <Pressable
            onPress={handleTrack}
            disabled={loading || !orderId.trim()}
            style={[
              styles.trackBtn,
              {
                backgroundColor: orderId.trim() ? colors.primary : colors.muted,
                opacity: loading ? 0.7 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFF9F2" />
            ) : (
              <>
                <Feather name="search" size={16} color="#FFF9F2" style={{ marginRight: 8 }} />
                <Text style={[styles.trackBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                  Track Order
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Error */}
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: "#fef2f2", borderColor: "#fca5a5" }]}>
            <Feather name="alert-circle" size={18} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={[styles.errorText, { fontFamily: "Inter_400Regular" }]}>{error}</Text>
          </View>
        ) : null}

        {/* Order result */}
        {order && (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={[styles.orderIdLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Order ID
                  </Text>
                  <Text style={[styles.orderIdValue, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                    {order.orderId}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        order.status === "delivered" ? "#dcfce7" : colors.secondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: order.status === "delivered" ? "#16a34a" : colors.primary,
                        fontFamily: "Inter_600SemiBold",
                      },
                    ]}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <Text style={[styles.infoLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Customer
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                {order.customer_name}
              </Text>

              <Text style={[styles.infoLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 10 }]}>
                Delivery Address
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                {order.address}, {order.city} - {order.pincode}
              </Text>

              {order.payment_confirmed && (
                <View style={[styles.paymentBadge, { backgroundColor: "#dcfce7" }]}>
                  <Feather name="check-circle" size={14} color="#16a34a" style={{ marginRight: 6 }} />
                  <Text style={[styles.paymentText, { color: "#16a34a", fontFamily: "Inter_500Medium" }]}>
                    Payment Confirmed
                  </Text>
                </View>
              )}
            </View>

            {/* Progress stepper */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 16 }]}>
                Order Progress
              </Text>
              {STATUS_STEPS.map((step, idx) => {
                const done = idx <= stepIndex;
                const active = idx === stepIndex;
                return (
                  <View key={step} style={styles.step}>
                    <View style={styles.stepLeft}>
                      <View
                        style={[
                          styles.stepCircle,
                          {
                            backgroundColor: done ? colors.primary : colors.muted,
                            borderColor: done ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        {/* @ts-ignore */}
                        <Feather
                          name={STATUS_ICONS[step] as any}
                          size={14}
                          color={done ? "#FFF9F2" : colors.mutedForeground}
                        />
                      </View>
                      {idx < STATUS_STEPS.length - 1 && (
                        <View
                          style={[
                            styles.stepLine,
                            { backgroundColor: done && idx < stepIndex ? colors.primary : colors.border },
                          ]}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        {
                          color: active ? colors.primary : done ? colors.foreground : colors.mutedForeground,
                          fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular",
                        },
                      ]}
                    >
                      {STATUS_LABELS[step]}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Items */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 12 }]}>
                Items
              </Text>
              {order.items?.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={[styles.itemName, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                    {item.name} × {item.qty}
                  </Text>
                  <Text style={[styles.itemPrice, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                    ₹{item.price * item.qty}
                  </Text>
                </View>
              ))}
              <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 10 }]} />
              <View style={styles.itemRow}>
                <Text style={[styles.totalLabel, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  Total
                </Text>
                <Text style={[styles.totalValue, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                  ₹{order.total}
                </Text>
              </View>
            </View>
          </>
        )}

        <View style={{ height: Platform.OS === "web" ? 100 : 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 22 },
  content: { padding: 16, gap: 16 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  cardTitle: { fontSize: 17, marginBottom: 6 },
  cardSub: { fontSize: 13, marginBottom: 16, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  trackBtnText: { fontSize: 16, color: "#FFF9F2" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  errorText: { flex: 1, fontSize: 14, color: "#ef4444" },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderIdLabel: { fontSize: 12, marginBottom: 2 },
  orderIdValue: { fontSize: 18 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12 },
  divider: { height: 1, marginVertical: 14 },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 15, marginTop: 2 },
  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  paymentText: { fontSize: 13 },
  step: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  stepLeft: { alignItems: "center", marginRight: 14 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLine: { width: 2, height: 24, marginTop: 2 },
  stepLabel: { fontSize: 14, paddingTop: 6 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  itemName: { fontSize: 14, flex: 1 },
  itemPrice: { fontSize: 14 },
  totalLabel: { fontSize: 16 },
  totalValue: { fontSize: 18 },
});
