const multer = require('multer');
const path = require('path');
const fs = require('fs');

class UploadController {
  constructor() {
    // 确保上传目录存在
    this.uploadDir = path.join(__dirname, '../uploads');
    this.ensureUploadDir();
    
    // 配置multer
    this.storage = multer.memoryStorage();
    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        files: 5 // 最多5个文件
      },
      fileFilter: this.fileFilter.bind(this)
    });
  }

  // 确保上传目录存在
  ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    
    // 创建子目录
    const subDirs = ['images', 'documents', 'temp'];
    subDirs.forEach(dir => {
      const fullPath = path.join(this.uploadDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  // 文件过滤器
  fileFilter(req, file, cb) {
    const allowedTypes = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    };

    if (allowedTypes[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }

  // 生成唯一文件名
  generateFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const ext = path.extname(originalName);
    return `${timestamp}_${random}${ext}`;
  }

  // 保存文件到磁盘
  saveFile(buffer, fileName, subDir = 'images') {
    const filePath = path.join(this.uploadDir, subDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  // 单文件上传
  async uploadSingle(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的文件'
        });
      }

      const file = req.file;
      const fileName = this.generateFileName(file.originalname);
      const subDir = file.mimetype.startsWith('image/') ? 'images' : 'documents';
      
      // 保存文件
      const filePath = this.saveFile(file.buffer, fileName, subDir);
      
      // 生成访问URL
      const fileUrl = `/uploads/${subDir}/${fileName}`;

      res.json({
        success: true,
        message: '文件上传成功',
        data: {
          fileName: fileName,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          url: fileUrl,
          path: filePath
        }
      });
    } catch (error) {
      console.error('文件上传错误:', error);
      res.status(500).json({
        success: false,
        message: '文件上传失败'
      });
    }
  }

  // 多文件上传
  async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的文件'
        });
      }

      const uploadedFiles = [];

      for (const file of req.files) {
        const fileName = this.generateFileName(file.originalname);
        const subDir = file.mimetype.startsWith('image/') ? 'images' : 'documents';
        
        // 保存文件
        const filePath = this.saveFile(file.buffer, fileName, subDir);
        
        // 生成访问URL
        const fileUrl = `/uploads/${subDir}/${fileName}`;

        uploadedFiles.push({
          fileName: fileName,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          url: fileUrl,
          path: filePath
        });
      }

      res.json({
        success: true,
        message: `成功上传 ${uploadedFiles.length} 个文件`,
        data: {
          files: uploadedFiles,
          count: uploadedFiles.length
        }
      });
    } catch (error) {
      console.error('多文件上传错误:', error);
      res.status(500).json({
        success: false,
        message: '文件上传失败'
      });
    }
  }

  // 删除文件
  async deleteFile(req, res) {
    try {
      const { fileName, subDir = 'images' } = req.body;

      if (!fileName) {
        return res.status(400).json({
          success: false,
          message: '请提供文件名'
        });
      }

      const filePath = path.join(this.uploadDir, subDir, fileName);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({
          success: true,
          message: '文件删除成功'
        });
      } else {
        res.status(404).json({
          success: false,
          message: '文件不存在'
        });
      }
    } catch (error) {
      console.error('删除文件错误:', error);
      res.status(500).json({
        success: false,
        message: '删除文件失败'
      });
    }
  }

  // 获取文件信息
  async getFileInfo(req, res) {
    try {
      const { fileName, subDir = 'images' } = req.params;
      const filePath = path.join(this.uploadDir, subDir, fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: '文件不存在'
        });
      }

      const stats = fs.statSync(filePath);
      const fileUrl = `/uploads/${subDir}/${fileName}`;

      res.json({
        success: true,
        data: {
          fileName: fileName,
          fileSize: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          url: fileUrl,
          path: filePath
        }
      });
    } catch (error) {
      console.error('获取文件信息错误:', error);
      res.status(500).json({
        success: false,
        message: '获取文件信息失败'
      });
    }
  }

  // 获取上传统计
  async getUploadStats(req, res) {
    try {
      const imageDir = path.join(this.uploadDir, 'images');
      const docDir = path.join(this.uploadDir, 'documents');

      let imageCount = 0;
      let docCount = 0;
      let totalSize = 0;

      // 统计图片文件
      if (fs.existsSync(imageDir)) {
        const imageFiles = fs.readdirSync(imageDir);
        imageCount = imageFiles.length;
        imageFiles.forEach(file => {
          const filePath = path.join(imageDir, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        });
      }

      // 统计文档文件
      if (fs.existsSync(docDir)) {
        const docFiles = fs.readdirSync(docDir);
        docCount = docFiles.length;
        docFiles.forEach(file => {
          const filePath = path.join(docDir, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        });
      }

      res.json({
        success: true,
        data: {
          totalFiles: imageCount + docCount,
          imageFiles: imageCount,
          documentFiles: docCount,
          totalSize: totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
        }
      });
    } catch (error) {
      console.error('获取上传统计错误:', error);
      res.status(500).json({
        success: false,
        message: '获取上传统计失败'
      });
    }
  }

  // 清理临时文件
  async cleanupTempFiles(req, res) {
    try {
      const tempDir = path.join(this.uploadDir, 'temp');
      
      if (!fs.existsSync(tempDir)) {
        return res.json({
          success: true,
          message: '临时目录不存在，无需清理'
        });
      }

      const files = fs.readdirSync(tempDir);
      let deletedCount = 0;

      files.forEach(file => {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        
        // 删除超过24小时的临时文件
        const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
        if (ageInHours > 24) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });

      res.json({
        success: true,
        message: `清理完成，删除了 ${deletedCount} 个临时文件`
      });
    } catch (error) {
      console.error('清理临时文件错误:', error);
      res.status(500).json({
        success: false,
        message: '清理临时文件失败'
      });
    }
  }
}

module.exports = new UploadController();