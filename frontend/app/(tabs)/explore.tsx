import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '@/styles/theme';

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Khám phá</Text>
      <Text style={styles.subtitle}>Tính năng đang phát triển</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.muted,
  },
});
