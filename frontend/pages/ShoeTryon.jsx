import React, { useState } from 'react';
import { message } from 'antd';
import AIToolWorkspace from '../components/Common/AIToolWorkspace';
import aiModelService from '../services/aiModelService';

const ShoeTryon = () => {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (params) => {
    setGenerating(true);
    try {
      // 调用鞋靴试穿生成服务
      const result = await aiModelService.generateShoeTryOn(params);
      return result;
    } catch (error) {
      console.error('鞋靴试穿生成失败:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="shoe-tryon-page">
      <AIToolWorkspace 
        toolId="shoe-tryon"
        onGenerate={handleGenerate}
        generating={generating}
      />
    </div>
  );
};

export default ShoeTryon;