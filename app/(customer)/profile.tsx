import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert, ScrollView, Modal, Pressable, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { LocationSelector } from '@/components/LocationSelector';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { useProductStore } from '@/stores/productStore';
import { Location } from '@/types';
import { companiesData, CompanyDetails } from '@/mocks/companies';
import { AntDesign } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setLocation, updateProfile, changePassword, isLoading } = useAuthStore();
  const { products } = useProductStore();
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetails | null>(null);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [currentBankPage, setCurrentBankPage] = useState(0);
  
  // Edit profile state
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  
  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      (async () => {
        try {
          console.log('Customer logout (web) initiated...');
          await logout();
        } catch (error) {
          console.error('Customer logout (web) error:', error);
        } finally {
          console.log('Navigating to login (web) ...');
          router.replace('/login');
        }
      })();
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            try {
              console.log('Customer logout initiated...');
              await logout();
              console.log('Customer logout completed, navigating to login...');
              router.replace('/login');
            } catch (error) {
              console.error('Customer logout error:', error);
              // Force navigation to login even if logout fails
              router.replace('/login');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleLocationChange = (location: Location) => {
    Alert.alert(
      'Location Already Set',
      'Your location has already been set and cannot be changed. This ensures you only see products available in your area.',
      [
        { text: 'OK', style: 'default' },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    
    try {
      await updateProfile({
        name: editName,
        phone: editPhone,
        address: editAddress,
      });
      Alert.alert('Success', 'Profile updated successfully');
      setShowEditProfile(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
    }
  };

  const handleCompanyPress = (company: CompanyDetails) => {
    setSelectedCompany(company);
    setShowCompanyDetails(true);
  };

  const handleDownloadCompanyPDF = async (company: CompanyDetails) => {
    // Filter products by company and user location
    const companyProducts = products.filter(product => 
      product.company === company.name && 
      user?.location && 
      product.locations.includes(user.location)
    );

    if (companyProducts.length === 0) {
      Alert.alert('No Products', 'No products available from this company in your location.');
      return;
    }

    try {
      // Generate PDF content
      const pdfContent = generateCompanyProductsPDF(company, companyProducts);
      
      // For now, just show an alert. In a real app, you'd generate and download the PDF
      Alert.alert(
        'PDF Generated', 
        `PDF with ${companyProducts.length} products from ${company.name} would be downloaded here.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };

  const generateCompanyProductsPDF = (company: CompanyDetails, products: any[]) => {
    // This would generate actual PDF content in a real implementation
    return `Company: ${company.name}\nProducts: ${products.length}`;
  };

  // Get unique companies from products available in user's location
  const getAvailableCompanies = () => {
    if (!user?.location) return [];
    
    const locationProducts = products.filter(product => 
      product.locations.includes(user.location!)
    );
    
    const uniqueCompanyNames = Array.from(new Set(locationProducts.map(p => p.company)));
    
    return companiesData.filter(company => 
      uniqueCompanyNames.includes(company.name)
    );
  };

  const availableCompanies = getAvailableCompanies();

  // Bank details for both locations
  const bankDetails = [
    {
      location: 'Mungana',
      companyName: 'RIDDHI SIDDHI ENTERPRISES',
      address: 'MUNGANA, TEH. DHARIYAWAD, DISTT. PRATAPGARH (RAJASTHAN)',
      bankName: 'BANK OF BARODA',
      accountNumber: '16950200000077',
      ifscCode: 'BARB0NARWAL'
    },
    {
      location: 'Udaipur',
      companyName: 'RIDDHI SIDDHI TRADING HUB',
      address: 'SAVINA TO KHEDA CIRCLE ROAD, UDAIPUR, (RAJASTHAN)',
      bankName: 'ICICI BANK',
      accountNumber: '693605601525',
      ifscCode: 'ICIC0006936'
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{user?.name || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{user?.address || 'Not set'}</Text>
          </View>
          
          <Button
            title="Edit Profile"
            onPress={() => setShowEditProfile(true)}
            variant="outline"
            fullWidth
            style={styles.actionButton}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Location</Text>
          <Text style={styles.sectionSubtitle}>
            Products are filtered based on your location. Location cannot be changed once set.
          </Text>
          
          <View style={styles.locationDisplay}>
            <Text style={styles.locationText}>{user?.location || 'Not set'}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <Button
            title="Change Password"
            onPress={() => setShowChangePassword(true)}
            variant="outline"
            fullWidth
            style={styles.actionButton}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Bank Details</Text>
          <Text style={styles.sectionSubtitle}>
            Swipe to view bank details for different locations
          </Text>
          
          <View style={styles.bankPagerContainer}>
            <View style={styles.bankPagerHeader}>
              <Pressable 
                style={[styles.navButton, currentBankPage === 0 && styles.navButtonDisabled]}
                onPress={() => setCurrentBankPage(0)}
                disabled={currentBankPage === 0}
              >
                <AntDesign name="left" size={20} color={currentBankPage === 0 ? colors.textLight : colors.primary} />
              </Pressable>
              
              <Text style={styles.bankLocationTitle}>
                {bankDetails[currentBankPage].location}
              </Text>
              
              <Pressable 
                style={[styles.navButton, currentBankPage === 1 && styles.navButtonDisabled]}
                onPress={() => setCurrentBankPage(1)}
                disabled={currentBankPage === 1}
              >
                <AntDesign name="right" size={20} color={currentBankPage === 1 ? colors.textLight : colors.primary} />
              </Pressable>
            </View>
            
<View style={styles.bankPager}>
              <View style={styles.bankDetailsContainer}>
                <View style={styles.companyDetailSection}>
                  <Text style={styles.detailLabel}>Company:</Text>
                  <Text style={styles.detailValue}>{bankDetails[currentBankPage].companyName}</Text>
                </View>
                
                <View style={styles.companyDetailSection}>
                  <Text style={styles.detailLabel}>Address:</Text>
                  <Text style={styles.detailValue}>{bankDetails[currentBankPage].address}</Text>
                </View>
                
                <View style={styles.companyDetailSection}>
                  <Text style={styles.detailLabel}>Bank Name:</Text>
                  <Text style={styles.detailValue}>{bankDetails[currentBankPage].bankName}</Text>
                </View>
                
                <View style={styles.companyDetailSection}>
                  <Text style={styles.detailLabel}>Account Number:</Text>
                  <Text style={styles.detailValue}>{bankDetails[currentBankPage].accountNumber}</Text>
                </View>
                
                <View style={styles.companyDetailSection}>
                  <Text style={styles.detailLabel}>IFSC Code:</Text>
                  <Text style={styles.detailValue}>{bankDetails[currentBankPage].ifscCode}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.pageIndicator}>
              {bankDetails.map((_, index) => (
                <View 
                  key={index}
                  style={[
                    styles.pageIndicatorDot,
                    currentBankPage === index && styles.pageIndicatorDotActive
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            fullWidth
            style={styles.logoutButton}
            loading={isLoading}
          />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <Input
              label="Name"
              placeholder="Enter your name"
              value={editName}
              onChangeText={setEditName}
            />
            
            <Input
              label="Phone"
              placeholder="Enter your phone number"
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
            />
            
            <Input
              label="Address"
              placeholder="Enter your address"
              value={editAddress}
              onChangeText={setEditAddress}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowEditProfile(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Save"
                onPress={handleUpdateProfile}
                loading={isLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChangePassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <Input
              label="Current Password"
              placeholder="Enter current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            
            <Input
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            
            <Input
              label="Confirm New Password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowChangePassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Change Password"
                onPress={handleChangePassword}
                loading={isLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Company Details Modal */}
      <Modal
        visible={showCompanyDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompanyDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{selectedCompany?.name}</Text>
              
              <View style={styles.companyDetailSection}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{selectedCompany?.address}</Text>
              </View>
              
              <View style={styles.companyDetailSection}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{selectedCompany?.phone}</Text>
              </View>
              
              <View style={styles.companyDetailSection}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{selectedCompany?.email}</Text>
              </View>
              
              <View style={styles.companyDetailSection}>
                <Text style={styles.detailLabel}>GST Number:</Text>
                <Text style={styles.detailValue}>{selectedCompany?.gst}</Text>
              </View>
              
              <Text style={styles.bankDetailsTitle}>Bank Details</Text>
              
              <View style={styles.companyDetailSection}>
                <Text style={styles.detailLabel}>Account Name:</Text>
                <Text style={styles.detailValue}>{selectedCompany?.bankDetails.accountName}</Text>
              </View>
              
              <View style={styles.companyDetailSection}>
                <Text style={styles.detailLabel}>Account Number:</Text>
                <Text style={styles.detailValue}>{selectedCompany?.bankDetails.accountNumber}</Text>
              </View>
              
              <View style={styles.companyDetailSection}>
                <Text style={styles.detailLabel}>Bank Name:</Text>
                <Text style={styles.detailValue}>{selectedCompany?.bankDetails.bankName}</Text>
              </View>
              
              <View style={styles.companyDetailSection}>
                <Text style={styles.detailLabel}>IFSC Code:</Text>
                <Text style={styles.detailValue}>{selectedCompany?.bankDetails.ifscCode}</Text>
              </View>
              
              <View style={styles.companyDetailSection}>
                <Text style={styles.detailLabel}>Branch:</Text>
                <Text style={styles.detailValue}>{selectedCompany?.bankDetails.branch}</Text>
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button
                title="Download Products PDF"
                onPress={() => {
                  if (selectedCompany) {
                    handleDownloadCompanyPDF(selectedCompany);
                  }
                }}
                style={styles.modalButton}
                icon={<AntDesign name="download" size={16} color={colors.white} />}
              />
              <Button
                title="Close"
                onPress={() => setShowCompanyDetails(false)}
                variant="outline"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: colors.textLight,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: colors.textLight,
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    marginTop: 16,
  },
  logoutButton: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  locationDisplay: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  companyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 8,
  },
  downloadButton: {
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 6,
  },
  noCompaniesText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 16,
  },
  companyDetailSection: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  bankDetailsContainer: {
    padding: 16,
    flex: 1,
  },
  bankDetailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  bankPagerContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  bankPagerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navButtonDisabled: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  bankLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  bankPager: {
    height: 320,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  pageIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  pageIndicatorDotActive: {
    backgroundColor: colors.primary,
    width: 12,
    height: 8,
    borderRadius: 4,
  },
});