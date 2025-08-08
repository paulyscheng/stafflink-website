import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useModal } from '../../../../shared/components/Modal/ModalService';

const RegisterForm = ({ onToggleForm }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    contactPerson: '',
    businessAddress: '',
    companyDescription: '',
    phoneNumber: '',
    verificationCode: '',
  });

  const [isCodeSent, setIsCodeSent] = useState(false);
  const modal = useModal();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const sendVerificationCode = () => {
    if (!formData.phoneNumber) {
      modal.error('Error', 'Please enter phone number');
      return;
    }
    setIsCodeSent(true);
    modal.success('Success', 'Verification code sent!');
  };

  const handleRegister = () => {
    if (!formData.companyName || !formData.industry || !formData.contactPerson || !formData.businessAddress) {
      modal.error('Error', 'Please fill in all required fields');
      return;
    }
    modal.success('Success', 'Account created successfully!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Company Information</Text>

      {/* Company Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Company Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter company name"
          value={formData.companyName}
          onChangeText={(value) => handleInputChange('companyName', value)}
        />
      </View>

      {/* Industry Selection */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Industry <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.industry}
            onValueChange={(value) => handleInputChange('industry', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select industry" value="" />
            <Picker.Item label="Construction" value="construction" />
            <Picker.Item label="Restaurant" value="restaurant" />
            <Picker.Item label="Manufacturing" value="manufacturing" />
          </Picker>
        </View>
      </View>

      {/* Contact Person */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Contact Person <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Full name"
          value={formData.contactPerson}
          onChangeText={(value) => handleInputChange('contactPerson', value)}
        />
      </View>

      {/* Business Address */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Business Address <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter business address"
          multiline
          numberOfLines={3}
          value={formData.businessAddress}
          onChangeText={(value) => handleInputChange('businessAddress', value)}
        />
      </View>

      {/* Company Description */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Company Description <Text style={styles.optional}>(Optional)</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Brief description of your company"
          multiline
          numberOfLines={3}
          value={formData.companyDescription}
          onChangeText={(value) => handleInputChange('companyDescription', value)}
        />
      </View>

      {/* Phone Verification */}
      <View style={styles.verificationContainer}>
        <Text style={styles.verificationTitle}>Phone Verification</Text>
        <View style={styles.phoneContainer}>
          <TextInput
            style={[styles.input, styles.phoneInput]}
            placeholder="Phone number"
            keyboardType="phone-pad"
            value={formData.phoneNumber}
            onChangeText={(value) => handleInputChange('phoneNumber', value)}
          />
          <TouchableOpacity
            style={styles.sendCodeButton}
            onPress={sendVerificationCode}
          >
            <Text style={styles.sendCodeButtonText}>
              {isCodeSent ? 'Resend' : 'Send Code'}
            </Text>
          </TouchableOpacity>
        </View>
        {isCodeSent && (
          <TextInput
            style={[styles.input, styles.verificationInput]}
            placeholder="Enter verification code"
            keyboardType="numeric"
            value={formData.verificationCode}
            onChangeText={(value) => handleInputChange('verificationCode', value)}
          />
        )}
      </View>

      {/* Register Button */}
      <TouchableOpacity
        style={styles.registerButton}
        onPress={handleRegister}
      >
        <Text style={styles.registerButtonText}>Create Account</Text>
      </TouchableOpacity>

      {/* Terms */}
      <Text style={styles.termsText}>
        By creating an account, you agree to our{' '}
        <Text style={styles.linkText}>Terms of Service</Text> and{' '}
        <Text style={styles.linkText}>Privacy Policy</Text>
      </Text>

      {/* Back to Login Link */}
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>
          Already have an account?{' '}
          <TouchableOpacity onPress={onToggleForm}>
            <Text style={styles.loginLink}>Sign in here</Text>
          </TouchableOpacity>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  optional: {
    color: '#9ca3af',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  picker: {
    height: 50,
  },
  verificationContainer: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phoneInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  sendCodeButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sendCodeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  verificationInput: {
    marginBottom: 0,
  },
  registerButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  linkText: {
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  loginContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginLink: {
    color: '#2563eb',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default RegisterForm;