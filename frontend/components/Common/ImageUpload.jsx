import React, { useState } from 'react'
import { Upload, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'

const { Dragger } = Upload

const ImageUpload = ({ value, onChange, placeholder, multiple = false, maxCount = 1 }) => {
  const [fileList, setFileList] = useState([])

  const handleChange = (info) => {
    const { fileList: newFileList } = info
    setFileList(newFileList)

    if (multiple) {
      // 多选模式：返回所有已上传成功的图片URL数组
      const uploadedImages = newFileList
        .filter(file => file.status === 'done')
        .map(file => URL.createObjectURL(file.originFileObj))
      onChange?.(uploadedImages)
      
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`)
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`)
      }
    } else {
      // 单选模式：保持原有逻辑
      if (info.file.status === 'done') {
        const imageUrl = URL.createObjectURL(info.file.originFileObj)
        onChange?.(imageUrl)
        message.success(`${info.file.name} 上传成功`)
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`)
      }
    }
  }

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('只能上传图片文件!')
      return false
    }
    
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('图片大小不能超过 10MB!')
      return false
    }

    // 模拟上传，实际项目中需要真实的上传接口
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(file)
      }, 1000)
    })
  }

  const customRequest = ({ file, onSuccess, onError }) => {
    // 模拟上传过程
    setTimeout(() => {
      onSuccess(file)
    }, 1000)
  }

  return (
    <Dragger
      name="file"
      multiple={multiple}
      fileList={fileList}
      onChange={handleChange}
      beforeUpload={beforeUpload}
      customRequest={customRequest}
      accept="image/*"
      style={{ background: '#fafafa' }}
      {...(multiple && maxCount ? { maxCount } : {})}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">
        {placeholder || '点击或拖拽图片到此区域上传'}
      </p>
      <p className="ant-upload-hint">
        支持 JPG、PNG、GIF 格式，文件大小不超过 10MB
        {multiple && maxCount > 1 && ` (最多${maxCount}张)`}
      </p>
    </Dragger>
  )
}

export default ImageUpload