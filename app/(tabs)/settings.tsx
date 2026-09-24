import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../lib/theme-provider'; // ایمپورت صحیح از تم‌پروایدر پروژه

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useThemeContext();
  const isDark = colorScheme === 'dark';

  const toggleTheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f9f9f9' }]}>
      <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
        تنظیمات برنامه
      </Text>

      {/* کلید روشن و خاموش کردن حالت شب */}
      <View style={[styles.settingItem, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
        <View style={styles.settingLabelContainer}>
          <Ionicons 
            name={isDark ? "moon" : "sunny"} 
            size={24} 
            color={isDark ? "#f39c12" : "#f1c40f"} 
          />
          <Text style={[styles.settingText, { color: isDark ? '#ffffff' : '#333333' }]}>
            حالت شب (Dark Mode)
          </Text>
        </View>

        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: '#767577', true: '#4f46e5' }}
          thumbColor={isDark ? '#ffffff' : '#f4f3f4'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'right',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
