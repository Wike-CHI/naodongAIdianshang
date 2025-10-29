import React, { useState } from 'react';
import { message } from 'antd';
import AIToolWorkspace from '../components/Common/AIToolWorkspace';
import aiModelService from '../services/aiModelService';

const TryOnClothes = () => {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (params) => {
    setGenerating(true);
    try {
      const result = await aiModelService.generateTryOn(params);
      return result;
    } catch (error) {
      console.error('同版型试衣生成失败:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="try-on-clothes-page">
      <AIToolWorkspace 
        toolId="try-on-clothes"
        onGenerate={handleGenerate}
        generating={generating}
      />
    </div>
  );
};

export default TryOnClothes;