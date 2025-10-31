import React, { useState } from 'react'
import { Upload, message, Modal } from 'antd'
import { InboxOutlined, PlusOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'

const ImageUpload = ({ value, onChange, placeholder, multiple = false, maxCount = 1 }) => {
  const [fileList, setFileList] = useState([])
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')

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

  const handlePreview = (file) => {
    if (file.url) {
      setPreviewImage(file.url)
    } else if (file.originFileObj) {
      setPreviewImage(URL.createObjectURL(file.originFileObj))
    }
    setPreviewVisible(true)
  }

  const handleRemove = (file) => {
    const newFileList = fileList.filter(item => item.uid !== file.uid)
    setFileList(newFileList)
    
    if (multiple) {
      const uploadedImages = newFileList
        .filter(item => item.status === 'done')
        .map(item => URL.createObjectURL(item.originFileObj))
      onChange?.(uploadedImages)
    } else {
      onChange?.(null)
    }
  }

  // 自定义上传框渲染
  const renderUploadArea = () => {
    // 多选模式
    if (multiple) {
      return (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 8,
          width: '100%',
          minHeight: '120px'
        }}>
          {fileList.map((file) => {
            if (file.status === 'done') {
              const imageUrl = file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : '')
              return (
                <div 
                  key={file.uid}
                  style={{ 
                    width: '100px', 
                    height: '100px', 
                    position: 'relative',
                    border: '1px solid #d9d9d9',
                    borderRadius: 4
                  }}
                >
                  <img 
                    src={imageUrl} 
                    alt="预览图片" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }} 
                    onClick={() => handlePreview(file)}
                  />
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: -8, 
                      right: -8, 
                      background: 'rgba(0,0,0,0.5)', 
                      borderRadius: '50%', 
                      width: 20, 
                      height: 20, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleRemove(file)}
                  >
                    <DeleteOutlined style={{ fontSize: 10 }} />
                  </div>
                </div>
              )
            }
            return null
          })}
          
          {/* 添加图片按钮 */}
          {fileList.filter(f => f.status === 'done').length < maxCount && (
            <div 
              style={{ 
                width: '100px', 
                height: '100px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed #d9d9d9',
                borderRadius: 4,
                cursor: 'pointer',
                background: '#fafafa'
              }}
            >
              <PlusOutlined style={{ fontSize: 24, color: '#999' }} />
            </div>
          )}
        </div>
      )
    }
    
    // 单选模式
    if (fileList.length > 0 && fileList[fileList.length - 1].status === 'done') {
      const file = fileList[fileList.length - 1]
      const imageUrl = file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : '')
      
      return (
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative',
            cursor: 'pointer'
          }}
          onClick={() => handlePreview(file)}
        >
          <img 
            src={imageUrl} 
            alt="预览图片" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              borderRadius: 4
            }} 
          />
          <div 
            style={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              background: 'rgba(0,0,0,0.5)', 
              borderRadius: '50%', 
              width: 24, 
              height: 24, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.stopPropagation()
              handleRemove(file)
            }}
          >
            <DeleteOutlined style={{ fontSize: 12 }} />
          </div>
        </div>
      )
    }
    
    // 默认上传区域
    return (
      <>
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
      </>
    )
  }

  return (
    <>
      <Upload.Dragger
        name="file"
        multiple={multiple}
        fileList={fileList}
        onChange={handleChange}
        beforeUpload={beforeUpload}
        customRequest={customRequest}
        accept="image/*"
        showUploadList={false} // 隐藏默认的文件列表
        style={{ 
          background: '#fafafa',
          minHeight: '160px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
      >
        {renderUploadArea()}
      </Upload.Dragger>
      
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <img alt="预览图片" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  )
}

export default ImageUpload