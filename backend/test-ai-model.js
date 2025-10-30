const aiModelService = require('./services/aiModelService');

async function testAIModel() {
  console.log('开始测试AI模特生成功能...');
  
  try {
    // 测试基本生成功能
    const result = await aiModelService.testGenerate();
    console.log('测试结果:', result);
    
    if (result.success) {
      console.log(`✅ 测试成功！图片已保存到: ${result.filePath}`);
    } else {
      console.log(`❌ 测试失败: ${result.error}`);
    }
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行测试
testAIModel();