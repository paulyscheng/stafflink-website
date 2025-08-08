import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const ErrorView = ({
  type = 'general', // 'general', 'network', 'notFound', 'permission', 'server'
  title,
  message,
  onRetry,
  retryText = '重试',
  showRetry = true,
  customAction,
  customActionText,
  style,
}) => {
  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: 'wifi',
          defaultTitle: '网络连接失败',
          defaultMessage: '请检查您的网络连接后重试',
          iconColor: '#6b7280',
        };
      case 'notFound':
        return {
          icon: 'search',
          defaultTitle: '未找到内容',
          defaultMessage: '抱歉，我们找不到您要查找的内容',
          iconColor: '#6b7280',
        };
      case 'permission':
        return {
          icon: 'lock',
          defaultTitle: '权限不足',
          defaultMessage: '您没有权限访问此内容',
          iconColor: '#f59e0b',
        };
      case 'server':
        return {
          icon: 'server',
          defaultTitle: '服务器错误',
          defaultMessage: '服务器遇到问题，请稍后再试',
          iconColor: '#ef4444',
        };
      default:
        return {
          icon: 'exclamation-circle',
          defaultTitle: '出错了',
          defaultMessage: '发生了一个错误，请重试',
          iconColor: '#ef4444',
        };
    }
  };

  const config = getErrorConfig();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${config.iconColor}15` }]}>
          <Icon name={config.icon} size={48} color={config.iconColor} />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {title || config.defaultTitle}
        </Text>

        {/* Message */}
        <Text style={styles.message}>
          {message || config.defaultMessage}
        </Text>

        {/* Actions */}
        <View style={styles.actionContainer}>
          {showRetry && onRetry && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onRetry}
              activeOpacity={0.7}
            >
              <Icon name="refresh" size={16} color="#ffffff" />
              <Text style={styles.primaryButtonText}>{retryText}</Text>
            </TouchableOpacity>
          )}

          {customAction && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={customAction}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>
                {customActionText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

// Empty State Component
export const EmptyView = ({
  icon = 'inbox',
  title = '暂无数据',
  message = '这里还没有任何内容',
  actionText,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, styles.emptyIconContainer]}>
          <Icon name={icon} size={48} color="#9ca3af" />
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Message */}
        <Text style={styles.message}>{message}</Text>

        {/* Action */}
        {onAction && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onAction}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={16} color="#ffffff" />
            <Text style={styles.primaryButtonText}>{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIconContainer: {
    backgroundColor: '#f3f4f6',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actionContainer: {
    gap: 12,
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
    minWidth: 140,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});

export default ErrorView;