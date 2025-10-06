import * as React from 'react';
import { Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/Theme';

type Props = {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  leading?: React.ReactNode;
};

export default function PrimaryButton({ title, onPress, style, leading }: Props) {
  return (
    <Pressable style={[styles.wrap, style]} onPress={onPress}>
      <LinearGradient
        colors={[Theme.colors.primary1, Theme.colors.primary2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.btn}
      >
        {leading}
        <Text style={styles.text}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: Theme.radius.xl, overflow: 'hidden' },
  btn: {
    minHeight: 52,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.radius.xl,
    flexDirection: 'row',
    gap: 8,
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
