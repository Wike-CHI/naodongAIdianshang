import React, { useState } from 'react';
import { message } from 'antd';
import AIToolWorkspace from '../components/Common/AIToolWorkspace';
import aiModelService from '../services/aiModelService';

const ModelVideo = () => {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (params) => {
    setGenerating(true);
    try {
      // 调用AI模特视频生成服务
      const result = await aiModelService.generateModelVideo(params);
      return result;
    } catch (error) {
      console.error('AI模特视频生成失败:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="model-video-page">
      <AIToolWorkspace 
        toolId="model-video"
        onGenerate={handleGenerate}
        generating={generating}
      />
    </div>
  );
};

export default ModelVideo;