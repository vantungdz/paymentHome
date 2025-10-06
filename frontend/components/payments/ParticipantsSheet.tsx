import * as React from 'react';
import {
  Modal, View, Text, FlatList, Pressable, TextInput, StyleSheet,
} from 'react-native';
import { Theme } from '@/constants/Theme';

export type Member = { id: string; name: string; phone?: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  members: Member[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  perPersonMoney: number; // kết quả chia đều
  search: string; setSearch: (s: string) => void;
  onConfirm: () => void;
};

export default function ParticipantsSheet({
  visible, onClose, members, selectedIds, onToggle, onToggleAll,
  perPersonMoney, search, setSearch, onConfirm,
}: Props) {
  const allChecked = selectedIds.length === members.length && members.length > 0;

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m =>
      m.name.toLowerCase().includes(q) || (m.phone ?? '').includes(q)
    );
  }, [search, members]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Chọn người thanh toán</Text>
          <Text style={styles.sub}>{selectedIds.length} người được chọn</Text>
        </View>

        <View style={styles.toolbar}>
          <TextInput
            placeholder="Tìm tên hoặc SĐT…"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
            placeholderTextColor="#9CA3AF"
          />
          <Pressable
            onPress={() => onToggleAll(!allChecked)}
            style={[styles.allBtn, allChecked && { backgroundColor: '#EEF2FF' }]}
          >
            <Text style={styles.allBtnText}>{allChecked ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</Text>
          </Pressable>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }}
          renderItem={({ item }) => {
            const checked = selectedIds.includes(item.id);
            return (
              <Pressable onPress={() => onToggle(item.id)} style={[styles.row, checked && styles.rowOn]}>
                <Text style={styles.check}>{checked ? '☑' : '☐'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  {!!item.phone && <Text style={styles.phone}>{item.phone}</Text>}
                </View>
              </Pressable>
            );
          }}
        />

        <View style={styles.footer}>
          <Text style={styles.perPerson}>
            Mỗi người: <Text style={styles.money}>
              {perPersonMoney.toLocaleString('vi-VN')} ₫
            </Text>
          </Text>
          <Pressable style={styles.confirm} onPress={onConfirm}>
            <Text style={styles.confirmText}>Xác nhận</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  title: { fontWeight: '800', fontSize: 16, color: Theme.colors.text },
  sub: { color: Theme.colors.sub, marginTop: 4, fontSize: 12 },
  toolbar: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  search: {
    flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: Theme.colors.border,
    paddingHorizontal: 12, backgroundColor: '#fff',
  },
  allBtn: {
    height: 44, paddingHorizontal: 12, borderRadius: 12,
    borderWidth: 1, borderColor: Theme.colors.border, alignItems: 'center', justifyContent: 'center',
  },
  allBtnText: { fontWeight: '700', color: Theme.colors.text },
  row: {
    borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff',
    borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  rowOn: { borderColor: '#C7D2FE', backgroundColor: '#F8FAFF' },
  check: { width: 22, textAlign: 'center', fontSize: 16 },
  name: { fontWeight: '700', color: Theme.colors.text },
  phone: { color: Theme.colors.sub, fontSize: 12 },
  footer: {
    padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  perPerson: { color: Theme.colors.sub },
  money: { color: Theme.colors.money, fontWeight: '800' },
  confirm: {
    backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
  },
  confirmText: { color: '#fff', fontWeight: '700' },
});
