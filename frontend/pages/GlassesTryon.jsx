import React, { useState } from 'react';
import { message } from 'antd';
import AIToolWorkspace from '../components/Common/AIToolWorkspace';
import aiModelService from '../services/aiModelService';

const GlassesTryon = () => {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (params) => {
    setGenerating(true);
    try {
      const result = await aiModelService.generateAccessoryTryOn(params);
      return result;
    } catch (error) {
      console.error('配件试戴生成失败:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="glasses-tryon-page">
      <AIToolWorkspace 
        toolId="glasses-tryon"
        onGenerate={handleGenerate}
        generating={generating}
      />
    </div>
  );
};

export default GlassesTryon;