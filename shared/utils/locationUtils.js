/**
 * 位置和距离计算工具
 * 用于计算工人和项目之间的距离
 */

/**
 * 使用 Haversine 公式计算两个经纬度坐标之间的距离
 * @param {number} lat1 - 第一个点的纬度
 * @param {number} lon1 - 第一个点的经度
 * @param {number} lat2 - 第二个点的纬度
 * @param {number} lon2 - 第二个点的经度
 * @returns {number} 距离（公里）
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径（公里）
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // 保留一位小数
}

/**
 * 将角度转换为弧度
 */
function toRad(degree) {
  return degree * (Math.PI / 180);
}

/**
 * 根据地址解析经纬度（模拟）
 * 在实际应用中，应该使用地图API（如高德、百度、Google Maps）
 */
function geocodeAddress(address) {
  // 模拟一些常见地址的经纬度
  const mockLocations = {
    // 北京地区
    '北京市朝阳区': { lat: 39.9388, lng: 116.4550 },
    '北京市海淀区': { lat: 39.9590, lng: 116.2980 },
    '北京市东城区': { lat: 39.9285, lng: 116.4160 },
    '北京市西城区': { lat: 39.9122, lng: 116.3659 },
    '北京市丰台区': { lat: 39.8585, lng: 116.2864 },
    '北京市石景山区': { lat: 39.9057, lng: 116.2229 },
    '北京市通州区': { lat: 39.9092, lng: 116.6563 },
    '北京市顺义区': { lat: 40.1301, lng: 116.6546 },
    '北京市昌平区': { lat: 40.2206, lng: 116.2312 },
    '北京市大兴区': { lat: 39.7262, lng: 116.3416 },
    
    // 上海地区
    '上海市浦东新区': { lat: 31.2214, lng: 121.5440 },
    '上海市黄浦区': { lat: 31.2316, lng: 121.4748 },
    '上海市静安区': { lat: 31.2286, lng: 121.4475 },
    '上海市徐汇区': { lat: 31.1885, lng: 121.4367 },
    '上海市长宁区': { lat: 31.2204, lng: 121.4243 },
    '上海市普陀区': { lat: 31.2496, lng: 121.3976 },
    '上海市虹口区': { lat: 31.2646, lng: 121.5052 },
    '上海市杨浦区': { lat: 31.2595, lng: 121.5260 },
    
    // 广州地区
    '广州市天河区': { lat: 23.1247, lng: 113.3615 },
    '广州市越秀区': { lat: 23.1292, lng: 113.2668 },
    '广州市海珠区': { lat: 23.0835, lng: 113.3173 },
    '广州市荔湾区': { lat: 23.1259, lng: 113.2441 },
    '广州市白云区': { lat: 23.1629, lng: 113.2735 },
    '广州市黄埔区': { lat: 23.1063, lng: 113.4590 },
    '广州市番禺区': { lat: 22.9379, lng: 113.3841 },
    
    // 深圳地区
    '深圳市福田区': { lat: 22.5220, lng: 114.0540 },
    '深圳市罗湖区': { lat: 22.5482, lng: 114.1315 },
    '深圳市南山区': { lat: 22.5333, lng: 113.9304 },
    '深圳市宝安区': { lat: 22.5556, lng: 113.8833 },
    '深圳市龙岗区': { lat: 22.7210, lng: 114.2479 },
    '深圳市盐田区': { lat: 22.5575, lng: 114.2365 },
    
    // 默认位置（北京市中心）
    'default': { lat: 39.9042, lng: 116.4074 }
  };

  // 尝试匹配地址
  for (const [key, value] of Object.entries(mockLocations)) {
    if (address && address.includes(key)) {
      return value;
    }
  }
  
  // 如果没有匹配，返回随机偏移的位置（模拟不同位置）
  const baseLocation = mockLocations.default;
  return {
    lat: baseLocation.lat + (Math.random() - 0.5) * 0.2,
    lng: baseLocation.lng + (Math.random() - 0.5) * 0.2
  };
}

/**
 * 计算工人与项目之间的距离
 * @param {Object} worker - 工人对象，包含 location 或 address 字段
 * @param {Object} project - 项目对象，包含 projectAddress 字段
 * @returns {number} 距离（公里）
 */
function calculateWorkerProjectDistance(worker, project) {
  // 获取工人位置
  let workerLocation;
  if (worker.location && worker.location.lat && worker.location.lng) {
    workerLocation = worker.location;
  } else if (worker.address) {
    workerLocation = geocodeAddress(worker.address);
  } else {
    // 如果工人没有地址，使用随机位置
    workerLocation = geocodeAddress(null);
  }
  
  // 获取项目位置
  let projectLocation;
  if (project.location && project.location.lat && project.location.lng) {
    projectLocation = project.location;
  } else if (project.projectAddress) {
    projectLocation = geocodeAddress(project.projectAddress);
  } else {
    projectLocation = geocodeAddress(null);
  }
  
  // 计算距离
  return calculateDistance(
    workerLocation.lat,
    workerLocation.lng,
    projectLocation.lat,
    projectLocation.lng
  );
}

/**
 * 格式化距离显示
 * @param {number} distance - 距离（公里）
 * @returns {string} 格式化的距离字符串
 */
function formatDistance(distance) {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
}

/**
 * 根据距离获取推荐级别
 * @param {number} distance - 距离（公里）
 * @returns {string} 推荐级别
 */
function getDistanceRecommendation(distance) {
  if (distance <= 2) {
    return 'excellent'; // 优秀 - 2公里以内
  } else if (distance <= 5) {
    return 'good'; // 良好 - 5公里以内
  } else if (distance <= 10) {
    return 'fair'; // 一般 - 10公里以内
  } else {
    return 'far'; // 较远 - 10公里以上
  }
}

/**
 * 模拟获取当前位置
 * 在实际应用中，应该使用设备的GPS定位
 */
async function getCurrentLocation() {
  return new Promise((resolve) => {
    // 模拟异步获取位置
    setTimeout(() => {
      // 返回北京市中心的坐标作为默认位置
      resolve({
        lat: 39.9042,
        lng: 116.4074,
        accuracy: 10,
        timestamp: Date.now()
      });
    }, 100);
  });
}

/**
 * 批量计算工人距离并排序
 * @param {Array} workers - 工人数组
 * @param {Object} project - 项目对象
 * @returns {Array} 带距离信息的工人数组（按距离排序）
 */
function calculateAndSortWorkersByDistance(workers, project) {
  const workersWithDistance = workers.map(worker => {
    const distance = calculateWorkerProjectDistance(worker, project);
    const recommendation = getDistanceRecommendation(distance);
    
    return {
      ...worker,
      distance,
      distanceText: formatDistance(distance),
      distanceRecommendation: recommendation,
      isNearby: distance <= 5 // 5公里以内算附近
    };
  });
  
  // 按距离排序
  return workersWithDistance.sort((a, b) => a.distance - b.distance);
}

/**
 * 生成模拟的工人地址
 * 用于测试和演示
 */
function generateMockWorkerAddress(workerId) {
  const addresses = [
    '北京市朝阳区建国路88号',
    '北京市海淀区中关村大街1号',
    '北京市东城区王府井大街255号',
    '北京市西城区西单北大街110号',
    '北京市丰台区丰台路63号',
    '北京市石景山区石景山路68号',
    '北京市通州区新华大街1号',
    '北京市顺义区府前街6号',
    '北京市昌平区政府街1号',
    '北京市大兴区兴政街15号',
    '上海市浦东新区世纪大道100号',
    '上海市黄浦区人民大道200号',
    '上海市静安区南京西路1688号',
    '上海市徐汇区漕溪北路336号',
    '广州市天河区天府路1号',
    '广州市越秀区府前路1号',
    '深圳市福田区福中三路1号',
    '深圳市南山区深南大道10000号',
  ];
  
  // 使用工人ID作为索引来保证同一工人总是返回相同地址
  const index = parseInt(workerId) % addresses.length;
  return addresses[index] || addresses[0];
}

module.exports = {
  calculateDistance,
  geocodeAddress,
  calculateWorkerProjectDistance,
  formatDistance,
  getDistanceRecommendation,
  getCurrentLocation,
  calculateAndSortWorkersByDistance,
  generateMockWorkerAddress,
};