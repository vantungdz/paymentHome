import React, { useEffect, useState } from 'react';
import { AdminPopup, SplitMoneyPopup } from '@/components/AdminPopup';
import { BeautifulAlert } from '@/components/BeautifulAlert';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/services/authService';
import paymentService, { PaymentRequest } from '@/services/paymentService';
import userService from '@/services/userService';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { AdminDashboardStyles as styles } from '../styles/components/AdminDashboard.styles';

// Removed unused width variable

export default function AdminDashboard() {
  const [total, setTotal] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<{[key: string]: {selected: boolean, amount: number}}>({});
  const [includeSelf, setIncludeSelf] = useState(false);
  // Removed unused isLoading state
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  
  // Popup states
  const [showSplitPopup, setShowSplitPopup] = useState(false);
  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [adminAction, setAdminAction] = useState<{
    type: 'single' | 'bulk';
    title: string;
    description: string;
    amount?: number;
    user?: User;
    users?: Array<{ user: User; amount: number }>;
    onConfirm: () => void;
  } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Reanimated shared values
  const dropdownProgress = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const menuOpacity = useSharedValue(0);
  
  // Removed unused colorScheme variable
  const { user, logout } = useAuth();

  useEffect(() => {
    loadPaymentRequests();
    loadUsers();
  }, []);

  // Animation effect for dropdown menu
  useEffect(() => {
    if (showUserMenu) {
      dropdownProgress.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      menuOpacity.value = withTiming(1, { duration: 200 });
    } else {
      dropdownProgress.value = withTiming(0, { duration: 200 });
      menuOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [showUserMenu]);

  // Animated styles
  const dropdownAnimatedStyle = useAnimatedStyle(() => {
    return {
      maxHeight: interpolate(dropdownProgress.value, [0, 1], [0, 200]),
      opacity: menuOpacity.value,
      transform: [
        {
          translateY: interpolate(dropdownProgress.value, [0, 1], [-20, 0]),
        },
      ],
    };
  });

  const arrowAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(dropdownProgress.value, [0, 1], [0, 180])}deg`,
        },
      ],
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const loadPaymentRequests = async () => {
    try {
      const response = await paymentService.getPaymentRequests();
      if (response.success && response.data) {
        setPaymentRequests(response.data.paymentRequests || []);
      }
    } catch (error) {
      console.log('Error loading payment requests:', error);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('Loading users...');
      const response = await userService.getUsers();
      console.log('Users response:', response);
      
      if (response.success && response.data) {
        const allUsers = response.data.users || [];
        // Lọc bỏ user hiện tại (admin) khỏi danh sách - so sánh bằng username
        const filteredUsers = allUsers.filter((u: User) => u.username !== user?.username);
        setUsers(filteredUsers);
        console.log('Loaded users:', filteredUsers);
      }
    } catch (error) {
      console.log('Error loading users:', error);
    }
  };

  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Animation functions
  const animateButtonPress = () => {
    buttonScale.value = withTiming(0.95, { duration: 100 }, () => {
      buttonScale.value = withTiming(1, { duration: 100 });
    });
  };

  const animateUserMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
    animateButtonPress();
  };

  const closeUserMenu = () => {
    if (showUserMenu) {
      setShowUserMenu(false);
    }
  };

  // Animated Button Component
  const AnimatedButton = ({ 
    style, 
    onPress, 
    children, 
    disabled = false 
  }: { 
    style: object, 
    onPress: () => void, 
    children: React.ReactNode,
    disabled?: boolean
  }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    const handlePress = () => {
      if (disabled) return;
      
      scale.value = withTiming(0.95, { duration: 100 }, () => {
        scale.value = withTiming(1, { duration: 100 });
      });
      
      setTimeout(() => onPress(), 50);
    };

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity 
          style={[style, disabled && { opacity: 0.6 }]} 
          onPress={handlePress}
          activeOpacity={0.8}
          disabled={disabled}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Rút gọn username nếu quá dài
  const truncateUsername = (username: string, maxLength: number = 20): string => {
    if (username.length <= maxLength) return username;
    
    // Nếu là email, giữ phần trước @ và rút gọn
    if (username.includes('@')) {
      const [localPart, domain] = username.split('@');
      if (localPart.length > maxLength - 8) {
        return `${localPart.substring(0, maxLength - 8)}...@${domain}`;
      }
      return username;
    }
    
    // Nếu không phải email, rút gọn bình thường
    return `${username.substring(0, maxLength - 3)}...`;
  };

  // Format number with thousands separator while typing
  const formatNumber = (value: string): string => {
    // Remove all non-digits
    const number = value.replace(/\D/g, '');
    // Add thousands separator
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Parse formatted number back to plain number
  const parseNumber = (value: string): number => {
    return Number(value.replace(/,/g, '')) || 0;
  };

  const handleTotalChange = (value: string) => {
    const formatted = formatNumber(value);
    setTotal(formatted);
  };

  const handleAmountChange = (userId: string, value: string) => {
    const formatted = formatNumber(value);
    const numericValue = parseNumber(formatted);
    
    setSelectedUsers(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        amount: numericValue
      }
    }));
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => ({
      ...prev,
      [userId]: {
        selected: !prev[userId]?.selected,
        amount: prev[userId]?.amount || 0
      }
    }));
  };

  const autoSplit = () => {
    if (!total) {
      BeautifulAlert.error('Lỗi', 'Vui lòng nhập tổng tiền');
      return;
    }
    
    const selectedUserIds = Object.keys(selectedUsers).filter(id => selectedUsers[id]?.selected);
    if (selectedUserIds.length === 0) {
      BeautifulAlert.error('Lỗi', 'Vui lòng chọn ít nhất một người để chia tiền');
      return;
    }
    
    // Hiển thị popup chia tiền đẹp
    setShowSplitPopup(true);
  };

  const handleSplitConfirm = () => {
    const selectedUserIds = Object.keys(selectedUsers).filter(id => selectedUsers[id]?.selected);
    
    const updated = { ...selectedUsers };
    selectedUserIds.forEach(userId => {
      if (updated[userId]) {
        updated[userId].amount = Math.round(parseNumber(total) / (selectedUserIds.length + (includeSelf ? 1 : 0)));
      }
    });
    
    if (includeSelf && user) {
      const adminData = users.find(u => u.phone === user.phone);
      if (adminData && adminData.id) {
        updated[adminData.id] = {
          selected: true,
          amount: perPerson
        };
      }
    }
    
    setSelectedUsers(updated);
    setShowSplitPopup(false);
    BeautifulAlert.success('Thành công', 'Đã chia tiền đều cho tất cả mọi người!');
  };

  // Removed unused handleAdminPopupConfirm function

  // Removed unused sendPaymentRequest function

  const sendAllRequests = async () => {
    const validRequests = Object.keys(selectedUsers)
      .filter(userId => selectedUsers[userId]?.selected && selectedUsers[userId]?.amount > 0)
      .map(userId => {
        const user = users.find((u: User) => u._id === userId);
        return user ? { user, amount: selectedUsers[userId].amount } : null;
      })
      .filter(Boolean) as { user: User; amount: number }[];

    // Thêm admin vào danh sách nếu "bao gồm bản thân" được chọn
    const allParticipants = [...validRequests];
    if (includeSelf) {
      // Tính số tiền admin cần đóng dựa trên chia đều
      const selectedUserIds = Object.keys(selectedUsers).filter(id => selectedUsers[id]?.selected);
      if (selectedUserIds.length > 0) {
        const totalAmount = parseNumber(total);
        const totalPeople = selectedUserIds.length + 1; // +1 cho admin
        const adminAmount = Math.round(totalAmount / totalPeople);
        
        allParticipants.push({
          user: {
            _id: user?.id || 'admin',
            fullName: user?.fullName || 'Admin',
            phone: user?.phone || '0000000000'
          },
          amount: adminAmount
        });
      }
    }
    
    if (allParticipants.length === 0) {
      BeautifulAlert.error('Lỗi', 'Không có người nào hợp lệ để gửi yêu cầu');
      return;
    }

    // Hiển thị popup xác nhận bulk payment
    setAdminAction({
      type: 'bulk',
      title: 'Gửi tất cả yêu cầu',
      description: description || 'Yêu cầu thanh toán',
      users: allParticipants,
      onConfirm: async () => {
        try {
          setIsLoading(true);
          
          // Tạo payment request trong database
          const totalAmount = allParticipants.reduce((sum, req) => sum + req.amount, 0);
          const response = await paymentService.createPaymentRequest({
            title: description || 'Yêu cầu thanh toán',
            description: description || 'Yêu cầu thanh toán',
            totalAmount,
            participants: allParticipants.map(req => ({
              name: req.user.fullName,
              phone: req.user.phone,
              amount: req.amount
            }))
          });

          if (response.success) {
            // Reload payment requests
            await loadPaymentRequests();
            
            const successMessage = includeSelf 
              ? `Đã tạo và gửi thành công ${validRequests.length} yêu cầu thanh toán (bạn cũng được bao gồm)`
              : `Đã tạo và gửi thành công ${validRequests.length} yêu cầu thanh toán`;
            BeautifulAlert.success('Thành công', successMessage);
          } else {
            BeautifulAlert.error('Lỗi', 'Không thể tạo yêu cầu thanh toán');
          }
        } catch (error) {
          console.log('Error creating payment requests:', error);
          BeautifulAlert.error('Lỗi', 'Có lỗi xảy ra khi tạo yêu cầu');
        } finally {
          setIsLoading(false);
        }
      }
    });
    setShowAdminPopup(true);
  };

  return (
    <TouchableWithoutFeedback onPress={closeUserMenu}>
      <ScrollView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity 
            style={styles.userInfoExpanded} 
            onPress={animateUserMenuToggle}
            activeOpacity={0.8}
          >
            <Text style={styles.welcomeText} numberOfLines={1} ellipsizeMode="middle">
              Xin chào, {user?.username ? truncateUsername(user.username) : 'Admin'} 👋
            </Text>
            <View style={styles.roleContainer}>
              <Text style={styles.roleText}>Quản trị viên</Text>
              <Animated.Text style={[styles.arrowIcon, arrowAnimatedStyle]}>
                ▼
              </Animated.Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ThemedView>

      {/* User Menu Dropdown */}
      {showUserMenu && (
        <Animated.View style={[styles.userMenuDropdown, dropdownAnimatedStyle]}>
          <View style={styles.userMenuContent}>
            <Text style={styles.fullUsernameText} numberOfLines={2}>
              📧 {user?.username}
            </Text>
            <Text style={styles.userDetailsText}>
              👤 {user?.fullName || 'Admin'}
            </Text>
            <Text style={styles.userRoleText}>
              🔑 Quản trị viên
            </Text>
            <View style={styles.menuDivider} />
            <TouchableOpacity 
              style={styles.dropdownLogoutButton} 
              onPress={() => {
                animateButtonPress();
                setTimeout(() => {
                  closeUserMenu();
                  setTimeout(logout, 200); // Đợi animation đóng xong
                }, 150);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownLogoutText}>🚪 Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Payment Creation Form */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          🧾 Tạo yêu cầu thanh toán
        </ThemedText>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả:</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="VD: Tiền phòng tháng 12"
            placeholderTextColor="#6b7280"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tổng tiền:</Text>
          <TextInput
            style={styles.input}
            value={total}
            onChangeText={handleTotalChange}
            placeholder="VD: 6,000,000"
            keyboardType="numeric"
            placeholderTextColor="#6b7280"
          />
        </View>

        {/* Include Self Checkbox */}
        <View style={styles.inputGroup}>
          <View style={styles.includeSelfSection}>
            <TouchableOpacity 
              style={styles.includeSelfContainer}
              onPress={() => setIncludeSelf(!includeSelf)}
            >
              <View style={[styles.checkbox, includeSelf && styles.checkboxSelected]}>
                {includeSelf && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.includeSelfLabel}>
                Bao gồm bản thân khi chia đều
              </Text>
            </TouchableOpacity>
            <Text style={styles.includeSelfHint}>
              {includeSelf ? '✅ Admin sẽ được tính vào khi chia tiền' : 'ℹ️ Admin sẽ không phải đóng tiền'}
            </Text>
          </View>
        </View>

        <AnimatedButton style={styles.autoSplitButton} onPress={autoSplit}>
          <Text style={styles.autoSplitText}>⚡ Chia đều tự động</Text>
        </AnimatedButton>
      </ThemedView>

      {/* Users Selection */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          👥 Chọn người thanh toán ({Object.keys(selectedUsers).filter(id => selectedUsers[id]?.selected).length} được chọn)
        </ThemedText>

        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Đang tải danh sách người dùng...</Text>
          </View>
        ) : (
          users.map((userItem: User) => {
            const isSelected = selectedUsers[userItem._id]?.selected || false;
            const amount = selectedUsers[userItem._id]?.amount || 0;
            
            return (
              <View key={userItem._id} style={[styles.userItem, isSelected && styles.userItemSelected]}>
                <TouchableOpacity 
                  style={styles.userInfo}
                  onPress={() => toggleUserSelection(userItem._id)}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{userItem.fullName}</Text>
                    <Text style={styles.userPhone}>{userItem.phone}</Text>
                  </View>
                </TouchableOpacity>

                {isSelected && (
                  <TextInput
                    style={styles.amountInput}
                    value={amount > 0 ? formatNumber(amount.toString()) : ''}
                    onChangeText={(value) => handleAmountChange(userItem._id, value)}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#6b7280"
                  />
                )}
              </View>
            );
          })
        )}

        <AnimatedButton style={styles.sendAllButton} onPress={sendAllRequests}>
          <Text style={styles.sendAllButtonText}>📤 Gửi tất cả yêu cầu đã chọn</Text>
        </AnimatedButton>
      </ThemedView>

      {/* Payment Requests History */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          📊 Lịch sử yêu cầu thanh toán
        </ThemedText>
        
        {paymentRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Chưa có yêu cầu thanh toán nào</Text>
          </View>
        ) : (
          paymentRequests.map((request) => (
            <View key={request._id} style={styles.paymentRequestItem}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentDescription}>{request.title}</Text>
                <Text style={[styles.paymentStatus, 
                  request.status === 'completed' && styles.statusCompleted,
                  request.status === 'sent' && styles.statusSent,
                  request.status === 'draft' && styles.statusDraft
                ]}>
                  {request.status === 'completed' ? '✅ Hoàn thành' :
                   request.status === 'sent' ? '📤 Đã gửi' : '📝 Bản nháp'}
                </Text>
              </View>
              
              <Text style={styles.paymentAmount}>
                {formatMoney(request.totalAmount)}
              </Text>
              
              <View style={styles.participantsList}>
                {request.participants.map((participant, index) => (
                  <View key={index} style={styles.participantItem}>
                    <Text style={styles.participantName}>
                      {participant.name} ({participant.phone})
                    </Text>
                    <Text style={styles.participantAmount}>
                      {formatMoney(participant.amount)}
                    </Text>
                    <Text style={[styles.participantStatus,
                      participant.status === 'paid' && styles.statusPaid,
                      participant.status === 'pending' && styles.statusPending
                    ]}>
                      {participant.status === 'paid' ? '✅' : '⏳'}
                    </Text>
                  </View>
                ))}
              </View>
              
              <Text style={styles.paymentDate}>
                {new Date(request.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          ))
        )}
      </ThemedView>

      {/* Popup Components */}
      <SplitMoneyPopup
        visible={showSplitPopup}
        totalAmount={parseNumber(total)}
        selectedUsers={Object.keys(selectedUsers).filter(id => selectedUsers[id]?.selected).length}
        includeSelf={includeSelf}
        perPerson={Math.round(parseNumber(total) / (Object.keys(selectedUsers).filter(id => selectedUsers[id]?.selected).length + (includeSelf ? 1 : 0)))}
        onConfirm={handleSplitConfirm}
        onClose={() => setShowSplitPopup(false)}
      />

      <AdminPopup
        visible={showAdminPopup}
        action={adminAction}
        onClose={() => {
          setShowAdminPopup(false);
          setAdminAction(null);
        }}
      />
    </ScrollView>
    </TouchableWithoutFeedback>
  );
}

// Styles moved to ../styles/components/AdminDashboard.styles.ts