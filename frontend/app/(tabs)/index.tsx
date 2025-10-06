import React from 'react';
import { ScrollView, Text, View, TouchableOpacity, Alert, RefreshControl, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import GlassCard from '@/components/ui/GlassCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import CreateRequestCard from '@/components/payments/CreateRequestCard';
import ParticipantsSheet from '@/components/payments/ParticipantsSheet';
import { PaymentPopup } from '@/components/PaymentPopup';
import { CustomModal } from '@/components/CustomModal';
import { Theme } from '@/styles/theme';
import paymentService, { PaymentRequest } from '@/services/paymentService';
import userService from '@/services/userService';
import apiService from '@/services/apiService';
import { Member } from '@/components/payments/ParticipantsSheet';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Form create request
  const [desc, setDesc] = React.useState('');
  const [total, setTotal] = React.useState(''); // dạng text: "6,000,000"
  const [includeSelf, setIncludeSelf] = React.useState(false);

  // Members & selection for split
  const [members, setMembers] = React.useState<Member[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState('');
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // Payment history
  const [paymentHistory, setPaymentHistory] = React.useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreatingPayment, setIsCreatingPayment] = React.useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentRequest | null>(null);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  
  // Validation states
  const [validationErrors, setValidationErrors] = React.useState<{ desc?: string; total?: string; }>({});

  // Load members
  React.useEffect(() => {
    loadMembers();
  }, []);

  // Load payment history
  React.useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await userService.getUsers();
      if (response.success) {
        // Convert User[] to Member[]
        const members = (response.data?.users || []).map(user => ({
          id: user.id,
          name: user.fullName,
          phone: user.phone
        }));
        setMembers(members);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      setIsLoading(true);
      const response = await paymentService.getPaymentRequests({ limit: 5 });
      if (response.success) {
        setPaymentHistory(response.data?.paymentRequests || []);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openSplit = () => {
    // Validate inputs
    const errors: { desc?: string; total?: string; } = {};
    
    if (!desc.trim()) {
      errors.desc = 'Vui lòng nhập mô tả';
    }
    
    if (!total.trim()) {
      errors.total = 'Vui lòng nhập tổng tiền';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors({});
    setSheetOpen(true);
  };

  const confirmSplit = async () => {
    if (selected.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một người');
      return;
    }

    setIsCreatingPayment(true);
    setSheetOpen(false);

    try {
      const totalAmount = parseInt(total.replace(/\D/g, ''));
      const memberCount = includeSelf ? selected.length + 1 : selected.length;
      const amountPerPerson = Math.floor(totalAmount / memberCount);

      // Map selected user IDs to member objects
      const selectedMembers = members.filter(m => selected.includes(m.id));
      
      // Create participants array
      const participants = selectedMembers.map(member => ({
        name: member.name,
        phone: member.phone,
        amount: amountPerPerson
      }));

      // Add self if includeSelf is true
      if (includeSelf && user) {
        participants.push({
          name: user.fullName,
          phone: user.phone,
          amount: amountPerPerson
        });
      }

      const createData = {
        title: desc,
        description: desc,
        totalAmount: totalAmount,
        participants: participants
      };

      const response = await paymentService.createPaymentRequest(createData);
      
      if (response.success) {
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
        // Reset form
        setDesc('');
        setTotal('');
        setSelected([]);
        setIncludeSelf(false);
        
        // Reload payment history
        loadPaymentHistory();
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể tạo yêu cầu thanh toán');
      }
    } catch (error) {
      console.error('Error creating payment request:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tạo yêu cầu thanh toán');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const showPaymentDetails = (payment: PaymentRequest) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleSendPaymentRequest = async (paymentId: string) => {
    try {
      const response = await paymentService.sendPaymentRequest(paymentId);
      if (response.success) {
        Alert.alert('Thành công', 'Đã gửi yêu cầu thanh toán');
        loadPaymentHistory();
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể gửi yêu cầu');
      }
    } catch (error) {
      console.error('Error sending payment request:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi gửi yêu cầu');
    }
  };

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <LinearGradient
        colors={[Theme.colors.white, Theme.colors.secondary]}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadPaymentHistory} />
          }
        >
          <GlassCard style={styles.loginCard}>
            <Text style={styles.loginIcon}>🔐</Text>
            <Text style={styles.loginTitle}>Cần đăng nhập</Text>
            <Text style={styles.loginMessage}>
              Vui lòng đăng nhập để sử dụng tính năng tạo yêu cầu thanh toán
            </Text>
            
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => {
                router.push('/login-screen');
              }}
            >
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[Theme.colors.white, Theme.colors.secondary]}
      style={{ flex: 1 }}
    >
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadPaymentHistory} />
        }
      >
        {/* User Info */}
        <GlassCard style={styles.userCard}>
          <Text style={styles.hello}>Xin chào 👋</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.role}>
            {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
          </Text>
        </GlassCard>

        {/* Create Payment Request */}
        <CreateRequestCard
          description={desc}
          setDescription={setDesc}
          total={total}
          setTotal={setTotal}
          includeSelf={includeSelf}
          setIncludeSelf={setIncludeSelf}
          onAutoSplit={openSplit}
          validationErrors={validationErrors}
        />

        {/* Success Message */}
        {showSuccessMessage && (
          <GlassCard style={styles.successCard}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successText}>Đã tạo yêu cầu thanh toán thành công!</Text>
          </GlassCard>
        )}

        {/* Quick Access to History */}
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => {
            router.push('/(tabs)/history');
          }}
        >
          <GlassCard style={styles.historyCard}>
            <View style={styles.historyCardContent}>
              <Text style={styles.historyIcon}>📚</Text>
              <View style={styles.historyTextContainer}>
                <Text style={styles.historyTitle}>Xem lịch sử yêu cầu</Text>
                <Text style={styles.historySubtitle}>
                  {paymentHistory.length > 0 
                    ? `${paymentHistory.length} yêu cầu đã tạo`
                    : 'Chưa có yêu cầu nào'
                  }
                </Text>
              </View>
              <Text style={styles.historyArrow}>→</Text>
        </View>
          </GlassCard>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom sheet chọn người */}
      <ParticipantsSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        members={members}
        selectedIds={selected}
        onToggle={(memberId) => {
          setSelected(prev => 
            prev.includes(memberId) 
              ? prev.filter(id => id !== memberId)
              : [...prev, memberId]
          );
        }}
        onToggleAll={(checked) => {
          if (checked) {
            setSelected(members.map(m => m.id));
          } else {
            setSelected([]);
          }
        }}
        perPersonMoney={total ? Math.floor(parseInt(total.replace(/\D/g, '')) / (includeSelf ? selected.length + 1 : selected.length)) : 0}
        search={search}
        setSearch={setSearch}
        onConfirm={confirmSplit}
      />

      {/* Payment Details Modal */}
      {selectedPayment && (
        <CustomModal
          visible={showPaymentModal}
          onBackdropPress={() => setShowPaymentModal(false)}
          title="Chi tiết thanh toán"
        >
          <PaymentPopup
            visible={showPaymentModal}
            paymentInfo={{
              adminPhone: selectedPayment.createdBy?.phone || '',
              amount: selectedPayment.totalAmount.toString(),
              message: `${selectedPayment.title} - ${user?.username}`,
              adminName: selectedPayment.createdBy?.username || 'Admin'
            }}
            onClose={() => setShowPaymentModal(false)}
          />
        </CustomModal>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 28,
    gap: 16,
  },
  userCard: {
    padding: 16,
  },
  hello: { fontSize: 15, color: Theme.colors.secondary, marginBottom: 4 },
  email: { fontSize: 18, color: Theme.colors.primary, fontWeight: '800' },
  role: { marginTop: 6, fontSize: 12, color: Theme.colors.secondary },
  sectionTitle: { marginTop: 4, marginBottom: -2, fontWeight: '800', color: Theme.colors.primary },
  loadingText: { 
    textAlign: 'center', 
    color: Theme.colors.secondary, 
    fontSize: 14, 
    paddingVertical: 20 
  },
  emptyText: { 
    textAlign: 'center', 
    color: Theme.colors.secondary, 
    fontSize: 14, 
    paddingVertical: 20,
    fontStyle: 'italic'
  },
  successCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  successIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  successText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    flex: 1,
  },
  historyButton: {
    marginTop: 4,
  },
  historyCard: {
    padding: 16,
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  historyTextContainer: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginBottom: 4,
  },
  historySubtitle: {
    fontSize: 14,
    color: Theme.colors.secondary,
  },
  historyArrow: {
    fontSize: 18,
    color: Theme.colors.primary,
    fontWeight: 'bold',
  },
  loginCard: {
    padding: 24,
    alignItems: 'center',
    marginTop: 60,
  },
  loginIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginBottom: 8,
  },
  loginMessage: {
    fontSize: 16,
    color: Theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
