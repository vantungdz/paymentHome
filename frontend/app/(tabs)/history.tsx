import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import paymentService, { PaymentRequest } from '@/services/paymentService';
import GlassCard from '@/components/ui/GlassCard';
import { Theme } from '@/constants/Theme';
import { useRouter } from 'expo-router';

type TabType = 'all' | 'draft' | 'sent' | 'completed';

export default function HistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [paymentHistory, setPaymentHistory] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const tabs = [
    { key: 'all', label: 'Tất cả', count: 0 },
    { key: 'draft', label: 'Bản nháp', count: 0 },
    { key: 'sent', label: 'Đã gửi', count: 0 },
    { key: 'completed', label: 'Hoàn tất', count: 0 },
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let statusFilter = '';
      if (activeTab !== 'all') {
        statusFilter = activeTab;
      }

      const response = await paymentService.getPaymentRequests({ 
        limit: 50, 
        status: statusFilter || 'draft,sent,completed' 
      });

      if (response.success && response.data) {
        setPaymentHistory(response.data.paymentRequests);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử thanh toán');
    } finally {
      setIsLoading(false);
    }
  };

  const showPaymentDetails = (payment: PaymentRequest) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleSendPaymentRequest = async () => {
    if (!selectedPayment) return;
    
    try {
      const response = await paymentService.sendPaymentRequest(selectedPayment._id);
      if (response.success) {
        Alert.alert('Thành công', 'Đã gửi yêu cầu thanh toán');
        setShowPaymentModal(false);
        loadData();
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể gửi yêu cầu');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi yêu cầu thanh toán');
    }
  };

  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'sent': return '#FF9800';
      case 'draft': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn tất';
      case 'sent': return 'Đã gửi';
      case 'draft': return 'Bản nháp';
      default: return 'Không xác định';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📋 Lịch sử yêu cầu</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContent}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tab}
                onPress={() => setActiveTab(tab.key as TabType)}
              >
                <Text style={isActive ? styles.activeTabText : styles.tabText}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.tabSeparator} />
      </View>

      {/* Payment List */}
      <ScrollView 
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} />
        }
      >
        {paymentHistory.length === 0 ? (
          <GlassCard style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'all' 
                ? 'Chưa có yêu cầu thanh toán nào'
                : `Chưa có yêu cầu ${tabs.find(t => t.key === activeTab)?.label.toLowerCase()} nào`
              }
            </Text>
          </GlassCard>
        ) : (
          paymentHistory.map((request) => (
            <TouchableOpacity
              key={request._id}
              onPress={() => showPaymentDetails(request)}
            >
              <GlassCard style={styles.historyItem}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{request.title}</Text>
                    <Text style={styles.itemDescription}>{request.description}</Text>
                    <Text style={styles.itemDate}>
                      {formatDate(request.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.itemAmount}>
                      {formatMoney(request.totalAmount)}
                    </Text>
                    <Text style={[
                      styles.itemStatus,
                      { color: getStatusColor(request.status) }
                    ]}>
                      {getStatusText(request.status)}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Payment Detail Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết yêu cầu thanh toán</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {selectedPayment && (
                <View style={styles.paymentDetailContainer}>
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>Tiêu đề:</Text>
                    <Text style={styles.paymentDetailValue}>{selectedPayment.title}</Text>
                  </View>
                  
                  {selectedPayment.description && (
                    <View style={styles.paymentDetailRow}>
                      <Text style={styles.paymentDetailLabel}>Mô tả:</Text>
                      <Text style={styles.paymentDetailValue}>{selectedPayment.description}</Text>
                    </View>
                  )}
                  
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>Tổng tiền:</Text>
                    <Text style={styles.paymentDetailValue}>
                      {formatMoney(selectedPayment.totalAmount)}
                    </Text>
                  </View>
                  
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>Trạng thái:</Text>
                    <Text style={[
                      styles.paymentDetailValue,
                      { color: getStatusColor(selectedPayment.status) }
                    ]}>
                      {getStatusText(selectedPayment.status)}
                    </Text>
                  </View>
                  
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>Người tạo:</Text>
                    <Text style={styles.paymentDetailValue}>{selectedPayment.createdBy.fullName}</Text>
                  </View>
                  
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>Ngày tạo:</Text>
                    <Text style={styles.paymentDetailValue}>
                      {new Date(selectedPayment.createdAt).toLocaleString('vi-VN')}
                    </Text>
                  </View>
                  
                  <View style={styles.participantsSection}>
                    <Text style={styles.participantsTitle}>Danh sách người tham gia:</Text>
                    {selectedPayment.participants.map((participant, index) => (
                      <View key={index} style={styles.participantRow}>
                        <View style={styles.participantInfo}>
                          <Text style={styles.participantName}>{participant.name}</Text>
                          <Text style={styles.participantPhone}>{participant.phone}</Text>
                        </View>
                        <View style={styles.participantRight}>
                          <Text style={styles.participantAmount}>
                            {formatMoney(participant.amount)}
                          </Text>
                          <Text style={[
                            styles.participantStatus,
                            { color: participant.status === 'paid' ? '#4CAF50' : '#FF9800' }
                          ]}>
                            {participant.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Send Payment Request Button for Admin */}
                  {user?.role === 'admin' && selectedPayment.status === 'draft' && (
                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={handleSendPaymentRequest}
                    >
                      <Text style={styles.sendButtonText}>📤 Gửi yêu cầu thanh toán</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  tabContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  tabContent: {
    paddingHorizontal: 20,
    gap: 0,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 1,
  },
  tabSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Theme.colors.sub,
    textAlign: 'center',
  },
  historyItem: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: Theme.colors.sub,
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: Theme.colors.sub,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.money,
    marginBottom: 4,
  },
  itemStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentDetailContainer: {
    padding: 20,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  paymentDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.sub,
    width: 80,
  },
  paymentDetailValue: {
    fontSize: 14,
    color: Theme.colors.text,
    flex: 1,
  },
  participantsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 12,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  participantPhone: {
    fontSize: 12,
    color: Theme.colors.sub,
  },
  participantRight: {
    alignItems: 'flex-end',
  },
  participantAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.money,
  },
  participantStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: Theme.colors.primary1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    flex: 1,
  },
  modalContent: {
    maxHeight: 400,
  },
});