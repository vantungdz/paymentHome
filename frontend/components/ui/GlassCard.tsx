import * as React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Theme } from '@/constants/Theme';

export default function GlassCard({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.cardGlass,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    ...Theme.shadow.soft,
  },
});
