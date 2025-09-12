// API配置
// 开发环境使用本机IP地址，生产环境使用真实域名
// 开发者需要修改这里的IP地址为自己电脑的IP
const DEV_API_URL = 'http://10.0.0.9:3000/api';
// const DEV_API_URL = 'http://114.236.168.232:3000/api';
// const DEV_API_URL = 'http://121.234.75.251:3000/api'
const PROD_API_URL = 'https://api.stafflink.com/api';

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// 调试信息（开发时可以看到当前使用的API地址）
if (__DEV__) {
  console.log('当前API地址:', API_URL);
}

// 其他配置
export const APP_CONFIG = {
  appName: 'StaffLink Company',
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