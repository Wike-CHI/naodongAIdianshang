// 简单测试脚本
console.log('开始测试...');

// 测试基本功能
const path = require('path');
const fs = require('fs').promises;

async function runTest() {
  try {
    console.log('测试路径解析...');
    const generatedDir = path.join(__dirname, 'generated');
    console.log('生成目录:', generatedDir);
    
    // 检查目录是否存在
    try {
      await fs.access(generatedDir);
      console.log('生成目录存在');
    } catch (error) {
      console.log('生成目录不存在，需要创建');
      await fs.mkdir(generatedDir, { recursive: true });
      console.log('生成目录已创建');
    }
    
    // 创建一个简单的测试文件
    const testFile = path.join(generatedDir, 'test.txt');
    await fs.writeFile(testFile, '这是一个测试文件');
    console.log('测试文件已创建:', testFile);
    
    console.log('测试完成！');
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

runTest();