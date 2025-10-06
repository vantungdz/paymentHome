import * as React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import GlassCard from '@/components/ui/GlassCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { Theme } from '@/constants/Theme';

// Utility functions for number formatting
const formatNumber = (value: string): string => {
  // Remove all non-numeric characters
  const numericValue = value.replace(/\D/g, '');
  
  // Add commas for thousands separator
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const parseNumber = (value: string): string => {
  // Remove all non-numeric characters
  return value.replace(/\D/g, '');
};

type Props = {
  description: string;
  setDescription: (v: string) => void;
  total: string;
  setTotal: (v: string) => void;
  includeSelf: boolean;
  setIncludeSelf: (v: boolean) => void;
  onAutoSplit: () => void;
  validationErrors?: {
    desc?: string;
    total?: string;
  };
};

export default function CreateRequestCard({
  description, setDescription, total, setTotal, includeSelf, setIncludeSelf, onAutoSplit, validationErrors,
}: Props) {
  // Handle total input with formatting
  const handleTotalChange = (value: string) => {
    // Store raw numeric value (no formatting)
    const rawValue = parseNumber(value);
    setTotal(rawValue);
  };

  // Display formatted value
  const displayTotal = total ? formatNumber(total) : '';

  return (
    <GlassCard style={{ gap: 14 }}>
      <Text style={styles.title}>🧾 Tạo yêu cầu thanh toán</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Mô tả</Text>
        <TextInput
          placeholder="VD: Tiền phòng tháng 12"
          value={description}
          onChangeText={setDescription}
          style={[
            styles.input,
            validationErrors?.desc && styles.inputError
          ]}
          placeholderTextColor="#9CA3AF"
        />
        {validationErrors?.desc && (
          <Text style={styles.errorText}>⚠️ {validationErrors.desc}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Tổng tiền</Text>
        <TextInput
          placeholder="VD: 6,000,000"
          keyboardType="numeric"
          value={displayTotal}
          onChangeText={handleTotalChange}
          style={[
            styles.input,
            validationErrors?.total && styles.inputError
          ]}
          placeholderTextColor="#9CA3AF"
        />
        {validationErrors?.total && (
          <Text style={styles.errorText}>⚠️ {validationErrors.total}</Text>
        )}
      </View>

      <View style={styles.hintRow}>
        <Text
          onPress={() => setIncludeSelf(!includeSelf)}
          style={[styles.checkbox, includeSelf && styles.checkboxOn]}
        >
          {includeSelf ? '☑' : '☐'}  Bao gồm bản thân khi chia đều
        </Text>
        <Text style={styles.note}>Admin sẽ không phải đóng tiền</Text>
      </View>

      <PrimaryButton title="⚡ Chia đều tự động" onPress={onAutoSplit} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '800', color: Theme.colors.text },
  field: { gap: 8 },
  label: { fontSize: 13, color: Theme.colors.sub, fontWeight: '600' },
  input: {
    height: 48,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  hintRow: { gap: 6 },
  checkbox: { fontSize: 14, color: Theme.colors.text, fontWeight: '600' },
  checkboxOn: { color: Theme.colors.primary2 },
  note: { fontSize: 12, color: Theme.colors.sub },
  inputError: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
    fontWeight: '500',
  },
});
