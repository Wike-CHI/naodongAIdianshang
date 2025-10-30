const aiModelService = require('./services/aiModelService');

async function testAIModel() {
  console.log('开始测试AI模特生成功能...');
  
  try {
    // 测试基本生成功能
    console.log('调用AI服务...');
    const result = await aiModelService.testGenerate();
    console.log('测试结果:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`✅ 测试成功！图片已保存到: ${result.filePath}`);
    } else {
      console.log(`❌ 测试失败: ${result.error}`);
    }
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    console.error('错误详情:', error.stack);
  }
  
  console.log('测试完成。');
}

// 设置超时，防止进程挂起
setTimeout(() => {
  console.log('测试超时，退出程序。');
  process.exit(1);
}, 30000); // 30秒超时

// 运行测试
testAIModel().catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});