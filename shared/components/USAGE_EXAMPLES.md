# StaffLink UI组件使用指南

## 1. 自定义模态框 (CustomModal)

### 替换 Alert.alert

**之前的代码：**
```javascript
import { Alert } from 'react-native';

Alert.alert(
  '提示',
  '操作成功！',
  [{ text: '确定', onPress: () => console.log('OK') }]
);
```

**使用新的 Modal：**
```javascript
import { useModal } from '../../shared/components/Modal/ModalService';

const MyComponent = () => {
  const modal = useModal();

  const handleSuccess = () => {
    modal.success('操作成功', '您的数据已保存');
  };

  const handleConfirm = () => {
    modal.confirm(
      '确认删除',
      '您确定要删除这个项目吗？此操作不可恢复。',
      () => console.log('确认删除'),
      () => console.log('取消')
    );
  };

  const handleError = () => {
    modal.error('操作失败', '网络连接错误，请稍后重试');
  };

  return (
    <View>
      <Button title="成功" onPress={handleSuccess} />
      <Button title="确认" onPress={handleConfirm} />
      <Button title="错误" onPress={handleError} />
    </View>
  );
};
```

### 自定义模态框内容

```javascript
const handleCustomModal = () => {
  modal.custom({
    type: 'custom',
    title: '自定义标题',
    showCloseButton: true,
    customContent: (
      <View>
        <Text>这是自定义内容</Text>
        <TextInput placeholder="输入内容" />
      </View>
    ),
    buttons: [
      {
        text: '取消',
        style: 'secondary',
        onPress: () => modal.hideModal()
      },
      {
        text: '确定',
        style: 'primary',
        onPress: () => {
          // 处理逻辑
          modal.hideModal();
        }
      }
    ]
  });
};
```

## 2. 加载动画 (LoadingSpinner)

### 基础使用

```javascript
import LoadingSpinner from '../../shared/components/Loading/LoadingSpinner';

// 简单加载
<LoadingSpinner />

// 带文字的加载
<LoadingSpinner text="加载中..." />

// 全屏加载
<LoadingSpinner fullScreen text="正在获取数据..." />

// 覆盖层加载
<LoadingSpinner overlay text="处理中..." />

// 不同大小
<LoadingSpinner size="small" />
<LoadingSpinner size="medium" />
<LoadingSpinner size="large" />

// 自定义颜色
<LoadingSpinner color="#10b981" text="保存中..." />
```

### 在数据加载中使用

```javascript
const MyScreen = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await ApiService.getData();
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="加载数据中..." />;
  }

  return (
    <View>
      {/* 显示数据 */}
    </View>
  );
};
```

## 3. 骨架屏加载 (SkeletonLoader)

### 列表骨架屏

```javascript
import { SkeletonList } from '../../shared/components/Loading/SkeletonLoader';

const MyListScreen = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  if (loading) {
    return (
      <View style={styles.container}>
        <SkeletonList count={5} />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => <ItemComponent item={item} />}
    />
  );
};
```

### 自定义骨架屏

```javascript
import SkeletonLoader, { SkeletonText } from '../../shared/components/Loading/SkeletonLoader';

const CustomSkeleton = () => (
  <View style={styles.card}>
    <View style={styles.header}>
      <SkeletonLoader width={60} height={60} borderRadius={30} />
      <View style={styles.headerText}>
        <SkeletonLoader width={150} height={20} />
        <SkeletonLoader width={100} height={16} style={{ marginTop: 4 }} />
      </View>
    </View>
    <SkeletonText lines={3} style={{ marginTop: 12 }} />
  </View>
);
```

## 4. 错误处理 (ErrorView)

### 网络错误

```javascript
import ErrorView from '../../shared/components/Error/ErrorView';

const MyScreen = () => {
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      const result = await ApiService.getData();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    }
  };

  if (error) {
    return (
      <ErrorView
        type="network"
        title="网络连接失败"
        message="请检查您的网络连接"
        onRetry={fetchData}
      />
    );
  }

  return <View>{/* 正常内容 */}</View>;
};
```

### 空状态

```javascript
import { EmptyView } from '../../shared/components/Error/ErrorView';

const MyListScreen = () => {
  const [items, setItems] = useState([]);

  if (items.length === 0) {
    return (
      <EmptyView
        icon="inbox"
        title="暂无项目"
        message="您还没有创建任何项目"
        actionText="创建第一个项目"
        onAction={() => navigation.navigate('CreateProject')}
      />
    );
  }

  return <FlatList data={items} />;
};
```

## 5. 错误边界 (ErrorBoundary)

错误边界已在 App.js 中配置，会自动捕获子组件的错误：

```javascript
// App.js
import ErrorBoundary from '../../shared/components/Error/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      {/* 所有应用内容 */}
    </ErrorBoundary>
  );
}
```

## 6. 完整示例：替换项目中的 Alert

**更新 LoginScreen.js：**

```javascript
// 之前
Alert.alert('错误', '请输入正确的手机号');

// 之后
const modal = useModal();
modal.error('错误', '请输入正确的手机号');
```

**更新 ProjectsScreen.js：**

```javascript
// 之前
Alert.alert(
  '确认删除',
  '确定要删除这个项目吗？',
  [
    { text: '取消', style: 'cancel' },
    { text: '确定', onPress: deleteProject }
  ]
);

// 之后
const modal = useModal();
modal.confirm(
  '确认删除',
  '确定要删除这个项目吗？',
  deleteProject,
  null // 取消回调（可选）
);
```

## 7. 加载状态最佳实践

```javascript
const MyScreen = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const modal = useModal();

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const result = await ApiService.getData();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
      modal.error('加载失败', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 初始加载
  if (loading && !data) {
    return <LoadingSpinner fullScreen text="加载中..." />;
  }

  // 错误状态
  if (error && !data) {
    return (
      <ErrorView
        type="network"
        onRetry={() => loadData()}
      />
    );
  }

  // 空状态
  if (!data || data.length === 0) {
    return (
      <EmptyView
        title="暂无数据"
        message="还没有任何内容"
      />
    );
  }

  // 正常显示
  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
        />
      }
    >
      {/* 内容 */}
    </ScrollView>
  );
};
```

## 注意事项

1. **ModalProvider** 必须包裹在应用的根组件中
2. **ErrorBoundary** 应该是最外层的组件
3. 使用 `useModal` hook 必须在 ModalProvider 内部
4. 加载动画在长时间操作时应该显示文字提示
5. 错误处理应该提供明确的重试选项

## 迁移清单

- [ ] 替换所有 `Alert.alert` 为 `modal.alert/confirm/error`
- [ ] 添加 LoadingSpinner 到所有异步操作
- [ ] 为列表页面添加 SkeletonLoader
- [ ] 为空状态添加 EmptyView
- [ ] 为网络错误添加 ErrorView
- [ ] 确保 App.js 包含 ErrorBoundary 和 ModalProvider