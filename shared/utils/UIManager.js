/**
 * UIManager - 统一的UI管理器
 * 用于替换所有原生Alert调用，提供专业的UI交互
 */

import React from 'react';
import { Vibration, Platform } from 'react-native';
import BrandConfig from '../config/brand';

// UI Manager instance
let toastInstance = null;
let modalInstance = null;

// 设置Toast实例
export const setToastInstance = (instance) => {
  toastInstance = instance;
};

// 设置Modal实例
export const setModalInstance = (instance) => {
  modalInstance = instance;
};

// 震动反馈
const hapticFeedback = (type = 'light') => {
  if (Platform.OS === 'ios') {
    // iOS specific haptic feedback
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [0, 10, 10, 10],
      warning: [0, 20, 20, 20],
      error: [0, 30, 30, 30],
    };
    
    Vibration.vibrate(patterns[type] || patterns.light);
  } else {
    // Android vibration
    const durations = {
      light: 10,
      medium: 20,
      heavy: 40,
      success: 10,
      warning: 20,
      error: 40,
    };
    
    Vibration.vibrate(durations[type] || durations.light);
  }
};

// Toast 通知
class Toast {
  static show(message, options = {}) {
    if (!toastInstance) {
      console.warn('Toast instance not set. Please wrap your app with ToastProvider.');
      return;
    }
    
    const { type = 'info', duration = 3000, haptic = true, ...rest } = options;
    
    if (haptic) {
      hapticFeedback(type === 'error' ? 'error' : type === 'success' ? 'success' : 'light');
    }
    
    return toastInstance.showToast(message, type, { duration, ...rest });
  }
  
  static success(message, options = {}) {
    return Toast.show(message, { ...options, type: 'success' });
  }
  
  static error(message, options = {}) {
    return Toast.show(message, { ...options, type: 'error' });
  }
  
  static warning(message, options = {}) {
    return Toast.show(message, { ...options, type: 'warning' });
  }
  
  static info(message, options = {}) {
    return Toast.show(message, { ...options, type: 'info' });
  }
}

// Modal 对话框
class Dialog {
  static show(config) {
    if (!modalInstance) {
      console.warn('Modal instance not set. Please wrap your app with ModalProvider.');
      return Promise.reject('Modal not initialized');
    }
    
    return new Promise((resolve) => {
      modalInstance.show({
        ...config,
        onClose: () => {
          if (config.onClose) config.onClose();
          resolve(false);
        },
        buttons: config.buttons?.map(button => ({
          ...button,
          onPress: () => {
            const result = button.onPress ? button.onPress() : true;
            resolve(result);
            modalInstance.hide();
          },
        })),
      });
    });
  }
  
  static alert(title, message, buttons = [], options = {}) {
    const { severity = 'info', ...rest } = options;
    
    const defaultButtons = buttons.length > 0 ? buttons : [
      { text: '确定', style: 'primary' }
    ];
    
    return Dialog.show({
      type: 'alert',
      severity,
      title,
      message,
      buttons: defaultButtons,
      ...rest,
    });
  }
  
  static confirm(title, message, options = {}) {
    const {
      confirmText = '确定',
      cancelText = '取消',
      confirmStyle = 'primary',
      cancelStyle = 'secondary',
      severity = 'info',
      ...rest
    } = options;
    
    return new Promise((resolve) => {
      Dialog.show({
        type: 'confirm',
        severity,
        title,
        message,
        buttons: [
          {
            text: cancelText,
            style: cancelStyle,
            onPress: () => {
              resolve(false);
              modalInstance.hide();
            },
          },
          {
            text: confirmText,
            style: confirmStyle,
            onPress: () => {
              resolve(true);
              modalInstance.hide();
            },
          },
        ],
        ...rest,
      });
    });
  }
  
  static success(title, message, options = {}) {
    return Dialog.alert(title, message, [], { ...options, severity: 'success' });
  }
  
  static error(title, message, options = {}) {
    return Dialog.alert(title, message, [], { ...options, severity: 'error' });
  }
  
  static warning(title, message, options = {}) {
    return Dialog.alert(title, message, [], { ...options, severity: 'warning' });
  }
  
  static info(title, message, options = {}) {
    return Dialog.alert(title, message, [], { ...options, severity: 'info' });
  }
  
  static custom(content, options = {}) {
    return Dialog.show({
      type: 'custom',
      children: content,
      ...options,
    });
  }
}

// Loading 指示器
class Loading {
  static show(message = '加载中...', options = {}) {
    if (!modalInstance) {
      console.warn('Modal instance not set. Please wrap your app with ModalProvider.');
      return;
    }
    
    const { cancelable = false, ...rest } = options;
    
    modalInstance.showLoading({
      message,
      cancelable,
      ...rest,
    });
  }
  
  static hide() {
    if (modalInstance) {
      modalInstance.hideLoading();
    }
  }
  
  static update(message) {
    if (modalInstance) {
      modalInstance.updateLoading({ message });
    }
  }
}

// Action Sheet
class ActionSheet {
  static show(options) {
    const {
      title,
      message,
      actions = [],
      cancelText = '取消',
      destructiveIndex,
    } = options;
    
    if (!modalInstance) {
      console.warn('Modal instance not set. Please wrap your app with ModalProvider.');
      return Promise.reject('Modal not initialized');
    }
    
    return new Promise((resolve) => {
      const buttons = actions.map((action, index) => ({
        text: action.text,
        style: index === destructiveIndex ? 'destructive' : 'secondary',
        icon: action.icon,
        onPress: () => {
          resolve(index);
          if (action.onPress) action.onPress();
          modalInstance.hide();
        },
      }));
      
      // Add cancel button
      buttons.push({
        text: cancelText,
        style: 'secondary',
        onPress: () => {
          resolve(-1);
          modalInstance.hide();
        },
      });
      
      Dialog.show({
        type: 'custom',
        title,
        message,
        buttons,
        closeOnBackdrop: true,
      });
    });
  }
}

// Progress 进度条
class Progress {
  static show(options = {}) {
    const {
      title = '处理中',
      message,
      progress = 0,
      total = 100,
      cancelable = false,
    } = options;
    
    if (!modalInstance) {
      console.warn('Modal instance not set. Please wrap your app with ModalProvider.');
      return;
    }
    
    modalInstance.showProgress({
      title,
      message,
      progress,
      total,
      cancelable,
    });
  }
  
  static update(progress, message) {
    if (modalInstance) {
      modalInstance.updateProgress({ progress, message });
    }
  }
  
  static hide() {
    if (modalInstance) {
      modalInstance.hideProgress();
    }
  }
}

// Snackbar 底部提示
class Snackbar {
  static show(message, options = {}) {
    const {
      duration = 3000,
      action,
      position = 'bottom',
      ...rest
    } = options;
    
    if (!toastInstance) {
      console.warn('Toast instance not set. Please wrap your app with ToastProvider.');
      return;
    }
    
    return toastInstance.showSnackbar(message, {
      duration,
      action,
      position,
      ...rest,
    });
  }
}

// 导出统一的UI管理器
const UIManager = {
  Toast,
  Dialog,
  Loading,
  ActionSheet,
  Progress,
  Snackbar,
  hapticFeedback,
  setToastInstance,
  setModalInstance,
};

// 导出便捷方法
export const {
  Toast: UIToast,
  Dialog: UIDialog,
  Loading: UILoading,
  ActionSheet: UIActionSheet,
  Progress: UIProgress,
  Snackbar: UISnackbar,
} = UIManager;

export default UIManager;