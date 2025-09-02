import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const CompleteJobScreen = ({ route, navigation }) => {
  const { jobId, job } = route.params || {};
  const [completionNotes, setCompletionNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // 选择照片
  const pickImage = async () => {
    // 请求权限
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('提示', '需要相册权限才能选择照片');
      return;
    }

    // 选择图片
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  // 拍照
  const takePhoto = async () => {
    // 请求权限
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('提示', '需要相机权限才能拍照');
      return;
    }

    // 打开相机
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  // 删除照片
  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  // 提交完成
  const handleSubmit = async () => {
    if (!completionNotes.trim()) {
      Alert.alert('提示', '请填写工作完成说明');
      return;
    }

    Alert.alert(
      '确认提交',
      '确认工作已完成并提交？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认提交',
          onPress: async () => {
            setSubmitting(true);
            try {
              const token = await AsyncStorage.getItem('authToken');
              
              // 这里实际应该先上传图片到服务器，获取URL
              // 暂时使用本地URI作为演示
              const photoUrls = photos;

              const response = await fetch(`${API_URL}/jobs/worker/complete`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  jobRecordId: jobId,
                  completionNotes,
                  photos: photoUrls,
                }),
              });

              const data = await response.json();
              
              if (response.ok) {
                Alert.alert(
                  '提交成功',
                  '工作完成信息已提交，等待企业确认',
                  [
                    {
                      text: '确定',
                      onPress: () => {
                        navigation.goBack();
                        navigation.goBack(); // 返回到工作列表
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('错误', data.error || '提交失败');
              }
            } catch (error) {
              Alert.alert('错误', '网络请求失败');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>完成工作</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 项目信息 */}
        <View style={styles.projectInfo}>
          <Icon name="briefcase-outline" size={20} color="#2563EB" />
          <View style={styles.projectDetails}>
            <Text style={styles.projectName}>{job?.project_name || '项目'}</Text>
            <Text style={styles.companyName}>{job?.company_name || '企业'}</Text>
          </View>
        </View>

        {/* 工作照片 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>工作照片</Text>
          <Text style={styles.sectionSubtitle}>上传工作现场照片（最多6张）</Text>
          
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity 
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <Icon name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            
            {photos.length < 6 && (
              <View style={styles.addPhotoButtons}>
                <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
                  <Icon name="camera-outline" size={32} color="#6B7280" />
                  <Text style={styles.addPhotoText}>拍照</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                  <Icon name="image-outline" size={32} color="#6B7280" />
                  <Text style={styles.addPhotoText}>相册</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* 完成说明 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>完成说明 *</Text>
          <Text style={styles.sectionSubtitle}>请描述工作完成情况</Text>
          
          <TextInput
            style={styles.textInput}
            placeholder="请输入工作完成情况说明..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            maxLength={500}
            value={completionNotes}
            onChangeText={setCompletionNotes}
            textAlignVertical="top"
          />
          
          <Text style={styles.charCount}>
            {completionNotes.length}/500
          </Text>
        </View>

        {/* 工作时长 */}
        {job?.start_work_time && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>工作时长</Text>
            <View style={styles.durationInfo}>
              <View style={styles.durationItem}>
                <Text style={styles.durationLabel}>开始时间</Text>
                <Text style={styles.durationValue}>
                  {new Date(job.start_work_time).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              <Icon name="arrow-forward" size={20} color="#6B7280" />
              <View style={styles.durationItem}>
                <Text style={styles.durationLabel}>结束时间</Text>
                <Text style={styles.durationValue}>
                  {new Date().toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
            <Text style={styles.totalDuration}>
              预计工时：{
                Math.round(
                  (new Date() - new Date(job.start_work_time)) / (1000 * 60 * 60) * 10
                ) / 10
              } 小时
            </Text>
          </View>
        )}

        {/* 注意事项 */}
        <View style={styles.notice}>
          <Icon name="information-circle-outline" size={20} color="#F59E0B" />
          <Text style={styles.noticeText}>
            提交后将通知企业确认，确认后工资将尽快发放
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Icon name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>提交完成</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  projectDetails: {
    marginLeft: 12,
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  companyName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  photoItem: {
    width: '31%',
    aspectRatio: 1,
    margin: '1.16%',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  addPhotoButtons: {
    flexDirection: 'row',
    width: '64%',
  },
  addPhotoButton: {
    width: '47%',
    aspectRatio: 1,
    margin: '1.5%',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  durationItem: {
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  durationValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  totalDuration: {
    fontSize: 14,
    color: '#2563EB',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  noticeText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  bottomSpacer: {
    height: 20,
  },
  bottomActions: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
});

export default CompleteJobScreen;