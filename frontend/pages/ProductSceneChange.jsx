import React, { useState } from 'react';
import { message } from 'antd';
import AIToolWorkspace from '../components/Common/AIToolWorkspace';
import aiModelService from '../services/aiModelService';

const ProductSceneChange = () => {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (params) => {
    setGenerating(true);
    try {
      // 调用场景更换生成服务
      const result = await aiModelService.generateSceneChange(params);
      return result;
    } catch (error) {
      console.error('场景更换生成失败:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="product-scene-change-page">
      <AIToolWorkspace 
        toolId="scene-change"
        onGenerate={handleGenerate}
        generating={generating}
      />
    </div>
  );
};

export default ProductSceneChange;