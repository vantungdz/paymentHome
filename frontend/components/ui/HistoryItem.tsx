import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from '@/components/ui/GlassCard';
import Tag from '@/components/ui/Tag';
import { Theme } from '@/constants/Theme';

type Props = {
  title: string;
  total: number;
  date: string; // 'dd/MM/yyyy'
  status?: 'draft' | 'done' | 'pending';
  subtitle?: string; // ví dụ: 'Văn B (0987696453)'
};

export default function HistoryItem({ title, total, date, status = 'draft', subtitle }: Props) {
  const totalStr = total.toLocaleString('vi-VN') + ' ₫';
  const tag =
    status === 'done' ? <Tag label="Hoàn tất" tone="success" /> :
    status === 'pending' ? <Tag label="Đang chờ" tone="default" /> :
    <Tag label="Bản nháp" tone="warning" />;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.sub}>{subtitle}</Text>}
        </View>
        <View style={styles.right}>
          {tag}
          <Text style={styles.date}>{date}</Text>
        </View>
      </View>
      <Text style={styles.money}>{totalStr}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 16, fontWeight: '700', color: Theme.colors.text },
  sub: { fontSize: 12, color: Theme.colors.sub, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 8 },
  date: { fontSize: 12, color: Theme.colors.sub },
  money: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.money,
    letterSpacing: 0.3,
  },
});
