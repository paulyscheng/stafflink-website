// API配置
export const API_URL = 'http://localhost:3000/api';

// 其他配置
export const APP_CONFIG = {
  appName: 'StaffLink Worker',
  version: '1.0.0',
  defaultLanguage: 'zh',
};

// 分页配置
export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
};

// 文件上传配置
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
};

// 地图配置
export const MAP_CONFIG = {
  defaultRegion: {
    latitude: 39.9042,
    longitude: 116.4074,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
};