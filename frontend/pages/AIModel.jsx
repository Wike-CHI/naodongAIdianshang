import React, { useState } from 'react';
import { message } from 'antd';
import AIToolWorkspace from '../components/Common/AIToolWorkspace';
import aiModelService from '../services/aiModelService';

const AIModel = () => {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (params) => {
    setGenerating(true);
    try {
      // 调用AI模特生成服务
      const result = await aiModelService.generateModel(params);
      return result;
    } catch (error) {
      console.error('AI模特生成失败:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="ai-model-page">
      <AIToolWorkspace 
        toolId="ai-model"
        onGenerate={handleGenerate}
        generating={generating}
      />
    </div>
  );
};

export default AIModel;