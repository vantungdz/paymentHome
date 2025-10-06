import * as React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Theme } from '@/constants/Theme';

type Props = { label: string; tone?: 'warning' | 'success' | 'default' };
export default function Tag({ label, tone = 'default' }: Props) {
  const bg =
    tone === 'success' ? '#E6F9EF' : tone === 'warning' ? '#FFF7E6' : Theme.colors.chipBg;
  const fg =
    tone === 'success' ? Theme.colors.success : tone === 'warning' ? '#B45309' : '#4B5563';
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  text: { fontSize: 12, fontWeight: '600' },
});
