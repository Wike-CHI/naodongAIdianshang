import React, { useState } from 'react';
import { message } from 'antd';
import AIToolWorkspace from '../components/Common/AIToolWorkspace';
import aiModelService from '../services/aiModelService';

const PoseVariation = () => {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (params) => {
    setGenerating(true);
    try {
      // 调用姿态变换生成服务
      const result = await aiModelService.generatePoseVariation(params);
      return result;
    } catch (error) {
      console.error('姿态变换生成失败:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="pose-variation-page">
      <AIToolWorkspace 
        toolId="pose-variation"
        onGenerate={handleGenerate}
        generating={generating}
      />
    </div>
  );
};

export default PoseVariation;