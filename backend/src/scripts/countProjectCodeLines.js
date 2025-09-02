const fs = require('fs');
const path = require('path');

// 统计结果
const stats = {
  totalLines: 0,
  totalFiles: 0,
  byType: {},
  byDirectory: {},
  largestFiles: []
};

// 要忽略的目录
const ignoreDirs = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.expo',
  'coverage',
  '.next',
  'android',
  'ios'
];

// 要统计的文件扩展名
const extensions = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.md',
  '.sql',
  '.css',
  '.scss',
  '.html'
];

// 递归遍历目录
function walkDir(dir, baseDir = '') {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        walkDir(filePath, path.join(baseDir, file));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        countFile(filePath, baseDir, ext);
      }
    }
  });
}

// 统计单个文件
function countFile(filePath, dir, ext) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    
    stats.totalLines += lines;
    stats.totalFiles += 1;
    
    // 按类型统计
    if (!stats.byType[ext]) {
      stats.byType[ext] = { files: 0, lines: 0 };
    }
    stats.byType[ext].files += 1;
    stats.byType[ext].lines += lines;
    
    // 按目录统计
    const dirKey = dir || 'root';
    if (!stats.byDirectory[dirKey]) {
      stats.byDirectory[dirKey] = { files: 0, lines: 0 };
    }
    stats.byDirectory[dirKey].files += 1;
    stats.byDirectory[dirKey].lines += lines;
    
    // 记录最大的文件
    stats.largestFiles.push({
      path: filePath.replace(/^.*\/Blue_collar\//, ''),
      lines: lines
    });
    
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
  }
}

// 格式化数字
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 主函数
function countProjectCode() {
  console.log('📊 统计 Blue Collar 项目代码量...\n');
  
  const projectRoot = path.join(__dirname, '../../../');
  
  // 统计各个主要目录
  const mainDirs = [
    { name: 'Backend', path: path.join(projectRoot, 'backend') },
    { name: 'Worker App', path: path.join(projectRoot, 'apps/worker') },
    { name: 'Company App', path: path.join(projectRoot, 'apps/company') },
    { name: 'Shared', path: path.join(projectRoot, 'shared') }
  ];
  
  mainDirs.forEach(({ name, path: dirPath }) => {
    if (fs.existsSync(dirPath)) {
      console.log(`📁 正在统计 ${name}...`);
      walkDir(dirPath, name);
    }
  });
  
  // 排序最大文件
  stats.largestFiles.sort((a, b) => b.lines - a.lines);
  stats.largestFiles = stats.largestFiles.slice(0, 10);
  
  // 输出结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 代码统计结果');
  console.log('='.repeat(60));
  
  console.log(`\n📈 总计:`);
  console.log(`   文件数: ${formatNumber(stats.totalFiles)}`);
  console.log(`   代码行数: ${formatNumber(stats.totalLines)}`);
  console.log(`   平均每文件: ${Math.round(stats.totalLines / stats.totalFiles)} 行`);
  
  console.log(`\n📁 按目录统计:`);
  Object.entries(stats.byDirectory)
    .sort((a, b) => b[1].lines - a[1].lines)
    .forEach(([dir, data]) => {
      console.log(`   ${dir.padEnd(20)} ${formatNumber(data.lines).padStart(8)} 行 (${data.files} 文件)`);
    });
  
  console.log(`\n📄 按文件类型统计:`);
  Object.entries(stats.byType)
    .sort((a, b) => b[1].lines - a[1].lines)
    .forEach(([type, data]) => {
      const percentage = ((data.lines / stats.totalLines) * 100).toFixed(1);
      console.log(`   ${type.padEnd(8)} ${formatNumber(data.lines).padStart(8)} 行 (${percentage}%) - ${data.files} 文件`);
    });
  
  console.log(`\n📊 最大的文件:`);
  stats.largestFiles.forEach((file, index) => {
    console.log(`   ${(index + 1).toString().padStart(2)}. ${file.path.padEnd(60)} ${formatNumber(file.lines).padStart(6)} 行`);
  });
  
  // 项目规模评估
  console.log(`\n🎯 项目规模评估:`);
  if (stats.totalLines < 10000) {
    console.log('   小型项目 (< 10,000 行)');
  } else if (stats.totalLines < 50000) {
    console.log('   中型项目 (10,000 - 50,000 行)');
  } else if (stats.totalLines < 100000) {
    console.log('   大型项目 (50,000 - 100,000 行)');
  } else {
    console.log('   超大型项目 (> 100,000 行)');
  }
  
  // 代码密度分析
  const jsFiles = stats.byType['.js'] || { files: 0, lines: 0 };
  const avgJsLines = jsFiles.files > 0 ? Math.round(jsFiles.lines / jsFiles.files) : 0;
  console.log(`\n💡 代码质量指标:`);
  console.log(`   JavaScript 平均文件大小: ${avgJsLines} 行`);
  if (avgJsLines < 100) {
    console.log('   ✅ 良好 - 文件大小适中');
  } else if (avgJsLines < 200) {
    console.log('   ⚠️  注意 - 部分文件可能过大');
  } else {
    console.log('   ❌ 警告 - 文件普遍过大，建议拆分');
  }
  
  console.log('\n✅ 统计完成！');
}

// 运行统计
countProjectCode();