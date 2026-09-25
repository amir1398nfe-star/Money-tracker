import React, { useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { AppIcon } from "@/components/finance-components";
import { ContextualHint } from "@/components/contextual-hint";
import { useFinance } from "@/lib/finance-store";
import { formatMoney, localeMeta, t } from "@/lib/i18n";
import { useChecks, type CheckItem, type CheckStatus } from "@/lib/check-store";
import { cancelCheckReminder, scheduleCheckReminder } from "@/lib/reminder-service";
import { isValidCheckDate, normalizeReminderDays } from "@/lib/check-utils";
import { CheckHistoryModal } from "@/components/check-history-modal";
import { recordCheckHistory } from "@/lib/check-history";

const statusConfig: Record<CheckStatus, { color: string; key: "pendingCheck" | "paidCheck" | "bouncedCheck" }> = {
  pending: { color: "#D49320", key: "pendingCheck" },
  paid: { color: "#2EBD85", key: "paidCheck" },
  bounced: { color: "#E76546", key: "bouncedCheck" },
};

export default function ChecksScreen() {
  const { locale } = useFinance();
  const { checks, addCheck, updateCheck, removeCheck } = useChecks();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [reminderDays, setReminderDays] = useState("3");

  const [statusFilter, setStatusFilter] = useState<CheckStatus | "all">("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [historyVisible, setHistoryVisible] = useState(false);

  const isRTL = localeMeta[locale].direction === "rtl";

  const reset = () => {
    setTitle("");
    setAmount("");
    setDueDate("");
    setNotes("");
    setReminderDays("3");
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (check: CheckItem) => {
    setEditingId(check.id);
    setTitle(check.title);
    setAmount(String(check.amount));
    setDueDate(check.dueDate);
    setNotes(check.notes);
    setReminderDays(String(check.reminderDaysBefore));
    setShowForm(true);
  };

  const save = async () => {
    const numericAmount = Number(amount.replace(/[^0-9]/g, ""));
    if (!title.trim() || !numericAmount || !isValidCheckDate(dueDate)) {
      Alert.alert(t(locale, "checks"), t(locale, "checkDateInvalid"));
      return;
    }

    const reminderDaysBefore = normalizeReminderDays(reminderDays) || 3;
    const existing = editingId ? checks.find((item) => item.id === editingId) : undefined;

    if (existing) {
      await cancelCheckReminder(existing.notificationId);
      const updated = {
        ...existing,
        title: title.trim(),
        amount: numericAmount,
        dueDate,
        notes: notes.trim(),
        reminderDaysBefore,
      };

      updateCheck(existing.id, {
        title: updated.title,
        amount: updated.amount,
        dueDate: updated.dueDate,
        notes: updated.notes,
        reminderDaysBefore,
        notificationId: undefined,
      });

      if (updated.reminderEnabled && updated.status === "pending") {
        const notificationId = await scheduleCheckReminder(updated, locale);
        if (notificationId) updateCheck(existing.id, { notificationId });
      }

      void recordCheckHistory({ checkId: existing.id, title: updated.title, kind: "updated", amount: updated.amount });
      Alert.alert(t(locale, "checks"), t(locale, "checkUpdated"));
    } else {
      const created = addCheck({
        title: title.trim(),
        amount: numericAmount,
        dueDate,
        notes: notes.trim(),
        status: "pending",
        reminderEnabled: true,
        reminderDaysBefore,
      });

      void recordCheckHistory({ checkId: created.id, title: created.title, kind: "created", amount: created.amount });
      const notificationId = await scheduleCheckReminder(created, locale);
      if (notificationId) updateCheck(created.id, { notificationId });
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    reset();
  };

  const toggleReminder = async (check: CheckItem, enabled: boolean) => {
    if (enabled && check.status === "pending") {
      const id = await scheduleCheckReminder({ ...check, reminderEnabled: true }, locale);
      updateCheck(check.id, { reminderEnabled: true, notificationId: id ?? undefined });
    } else {
      await cancelCheckReminder(check.notificationId);
      updateCheck(check.id, { reminderEnabled: enabled, notificationId: undefined });
    }
  };

  const setStatus = async (check: CheckItem, status: CheckStatus) => {
    if (status === check.status) return;
    if (status !== "pending") await cancelCheckReminder(check.notificationId);

    updateCheck(check.id, {
      status,
      notificationId: status === "pending" ? check.notificationId : undefined,
    });

    void recordCheckHistory({
      checkId: check.id,
      title: check.title,
      kind: "status",
      fromStatus: check.status,
      toStatus: status,
    });

    if (status === "pending" && check.reminderEnabled) {
      const id = await scheduleCheckReminder({ ...check, status }, locale);
      if (id) updateCheck(check.id, { notificationId: id });
    }
  };

  const remove = async (check: CheckItem) => {
    await cancelCheckReminder(check.notificationId);
    void recordCheckHistory({ checkId: check.id, title: check.title, kind: "deleted", amount: check.amount });
    removeCheck(check.id);
  };

  const months = Array.from(new Set(checks.map((check) => check.dueDate.slice(0, 7))))
    .sort()
    .reverse();

  const filteredChecks = checks.filter(
    (check) =>
      (statusFilter === "all" || check.status === statusFilter) &&
      (monthFilter === "all" || check.dueDate.startsWith(monthFilter))
  );

  return (
    <ScreenContainer containerClassName="bg-[#F8F7FC]" safeAreaClassName="bg-[#F8F7FC]">
      <ContextualHint
        screen="checks"
        locale={locale}
        titleKey="checksHintTitle"
        bodyKey="checksHintBody"
        icon="description"
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Filters & History Bar */}
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            gap: 7,
            flexWrap: "wrap",
            marginTop: 16,
            marginBottom: 4,
          }}
        >
          {(["all", "pending", "paid", "bounced"] as (CheckStatus | "all")[]).map((item) => (
            <Pressable
              key={item}
              onPress={() => setStatusFilter(item)}
              style={{
                borderRadius: 10,
                paddingHorizontal: 9,
                paddingVertical: 7,
                backgroundColor: statusFilter === item ? "#7C5CFC" : "#FFFFFF",
              }}
            >
              <Text
                style={{
                  color: statusFilter === item ? "#FFFFFF" : "#777487",
                  fontSize: 9,
                  fontWeight: "900",
                }}
              >
                {item === "all" ? t(locale, "filterAll") : t(locale, statusConfig[item].key)}
              </Text>
            </Pressable>
          ))}

          {months.map((month) => (
            <Pressable
              key={month}
              onPress={() => setMonthFilter(monthFilter === month ? "all" : month)}
              style={{
                borderRadius: 10,
                paddingHorizontal: 9,
                paddingVertical: 7,
                backgroundColor: monthFilter === month ? "#FFF0D8" : "#FFFFFF",
              }}
            >
              <Text style={{ color: "#A46D1B", fontSize: 9, fontWeight: "900" }}>
                {month === months[0] ? t(locale, "filterMonth") : month}
              </Text>
            </Pressable>
          ))}

          <Pressable
            onPress={() => setHistoryVisible(true)}
            style={{
              marginStart: "auto",
              borderRadius: 10,
              paddingHorizontal: 9,
              paddingVertical: 7,
              backgroundColor: "#F0ECFF",
            }}
          >
            <Text style={{ color: "#6C4EE4", fontSize: 9, fontWeight: "900" }}>
              {t(locale, "checkHistory")}
            </Text>
          </Pressable>
        </View>

        {/* Header */}
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ gap: 5, alignItems: isRTL ? "flex-end" : "flex-start" }}>
            <Text style={{ color: "#9996A8", fontSize: 12 }}>{t(locale, "thisMonth")}</Text>
            <Text style={{ color: "#28243E", fontSize: 28, fontWeight: "900" }}>
              {t(locale, "checks")}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowForm(true)}
            style={({ pressed }) => [
              {
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: "#7C5CFC",
                alignItems: "center",
                justifyContent: "center",
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <AppIcon name="add" color="#FFFFFF" size={25} />
          </Pressable>
        </View>

        {/* Checks List / Empty State */}
        {filteredChecks.length === 0 ? (
          <View
            style={{
              marginTop: 22,
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 30,
              alignItems: "center",
              gap: 10,
            }}
          >
            <AppIcon name="description" color="#B8A8FF" size={44} />
            <Text style={{ color: "#777487", fontSize: 13, fontWeight: "800", textAlign: "center" }}>
              {t(locale, "noChecks")}
            </Text>
            <Pressable
              onPress={() => setShowForm(true)}
              style={{ backgroundColor: "#F0ECFF", borderRadius: 13, paddingHorizontal: 16, paddingVertical: 11 }}
            >
              <Text style={{ color: "#6C4EE4", fontWeight: "900" }}>{t(locale, "addCheck")}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 13, marginTop: 22 }}>
            {filteredChecks.map((check) => {
              const status = statusConfig[check.status];
              return (
                <View
                  key={check.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 22,
                    padding: 17,
                    borderWidth: 1,
                    borderColor: "#EFEDF6",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: isRTL ? "row-reverse" : "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ flex: 1, gap: 5, alignItems: isRTL ? "flex-end" : "flex-start" }}>
                      <Text style={{ color: "#28243E", fontSize: 15, fontWeight: "900" }}>
                        {check.title}
                      </Text>
                      <Text style={{ color: "#9996A8", fontSize: 11 }}>
                        {t(locale, "dueDate")}: {check.dueDate}
                      </Text>
                      <Text style={{ color: "#777487", fontSize: 11, textAlign: isRTL ? "right" : "left" }}>
                        {check.notes || t(locale, "noNotes")}
                      </Text>
                    </View>
                    <Text style={{ color: status.color, fontSize: 15, fontWeight: "900" }}>
                      {formatMoney(check.amount, locale)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 6, flexWrap: "wrap" }}>
                    {(["pending", "paid", "bounced"] as CheckStatus[]).map((item) => (
                      <Pressable
                        key={item}
                        onPress={() => setStatus(check, item)}
                        style={{
                          borderRadius: 9,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          backgroundColor: check.status === item ? statusConfig[item].color : "#F4F2F8",
                        }}
                      >
                        <Text
                          style={{
                            color: check.status === item ? "#FFFFFF" : statusConfig[item].color,
                            fontSize: 9,
                            fontWeight: "900",
                          }}
                        >
                          {t(locale, statusConfig[item].key)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View
                    style={{
                      flexDirection: isRTL ? "row-reverse" : "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTopWidth: 1,
                      borderTopColor: "#F0EEF6",
                      paddingTop: 10,
                    }}
                  >
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 7 }}>
                      <AppIcon
                        name="notifications-none"
                        color={check.reminderEnabled && check.status === "pending" ? "#7C5CFC" : "#AAA6B8"}
                        size={17}
                      />
                      <Text style={{ color: "#777487", fontSize: 10 }}>
                        {t(locale, "reminderBefore")}: {check.reminderDaysBefore}
                      </Text>
                    </View>

                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
                      <Switch
                        value={check.reminderEnabled}
                        onValueChange={(value) => toggleReminder(check, value)}
                        trackColor={{ false: "#E5E1EF", true: "#B8A8FF" }}
                        thumbColor={check.reminderEnabled ? "#7C5CFC" : "#FFFFFF"}
                      />
                      <Pressable onPress={() => openEdit(check)}>
                        <AppIcon name="edit" color="#7C5CFC" size={19} />
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          Alert.alert(t(locale, "deleteCheck"), t(locale, "deleteCheckConfirm"), [
                            { text: t(locale, "cancel"), style: "cancel" },
                            { text: t(locale, "delete"), style: "destructive", onPress: () => remove(check) },
                          ])
                        }
                      >
                        <AppIcon name="delete-outline" color="#E76546" size={19} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <CheckHistoryModal visible={historyVisible} onClose={() => setHistoryVisible(false)} locale={locale} />

      {/* Add / Edit Form Modal */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={reset}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(26,20,46,0.35)" }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 22,
              paddingBottom: 30,
              gap: 13,
            }}
          >
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#28243E", fontSize: 20, fontWeight: "900" }}>
                {t(locale, editingId ? "editCheck" : "addCheck")}
              </Text>
              <Pressable onPress={reset}>
                <AppIcon name="close" color="#9996A8" size={23} />
              </Pressable>
            </View>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t(locale, "checkTitlePlaceholder")}
              placeholderTextColor="#B1ADBC"
              style={inputStyle(isRTL)}
            />
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder={t(locale, "amountPlaceholderCheck")}
              placeholderTextColor="#B1ADBC"
              keyboardType="numeric"
              style={inputStyle(isRTL)}
            />
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#B1ADBC"
              style={inputStyle(isRTL)}
            />
            <TextInput
              value={reminderDays}
              onChangeText={setReminderDays}
              placeholder={t(locale, "reminderBefore")}
              placeholderTextColor="#B1ADBC"
              keyboardType="number-pad"
              style={inputStyle(isRTL)}
            />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t(locale, "notesPlaceholder")}
              placeholderTextColor="#B1ADBC"
              multiline
              style={[inputStyle(isRTL), { minHeight: 70, textAlignVertical: "top" }]}
            />

            <Pressable
              onPress={save}
              style={({ pressed }) => [
                { backgroundColor: "#7C5CFC", borderRadius: 15, paddingVertical: 15, alignItems: "center" },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>
                {t(locale, editingId ? "saveChanges" : "save")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const inputStyle = (isRTL: boolean) => ({
  backgroundColor: "#F8F7FC",
  borderRadius: 14,
  paddingHorizontal: 15,
  paddingVertical: 13,
  color: "#28243E",
  fontSize: 13,
  textAlign: isRTL ? ("right" as const) : ("left" as const),
});
