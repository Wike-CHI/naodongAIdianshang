const User = require('../models/User');
const CreditRecord = require('../models/CreditRecord');
const Subscription = require('../models/Subscription');
const AIGeneration = require('../models/AIGeneration');
const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose');

// 获取用户列表（管理员）
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sort = '-created_at', status = '' } = req.query;
    
    const query = {};
    
    // 搜索条件
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 状态筛选
    if (status) {
      if (status === 'active') {
        query.is_active = true;
      } else if (status === 'inactive') {
        query.is_active = false;
      }
    }

    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password_hash -reset_password_token -email_verification_token')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
};

// 获取单个用户详情
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-password_hash -reset_password_token -email_verification_token');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 获取用户的订阅信息
    const currentSubscription = await Subscription.getCurrentSubscription(user._id);
    
    // 获取用户统计信息
    const [creditStats, generationStats] = await Promise.all([
      CreditRecord.getUserCreditStats(user._id),
      AIGeneration.aggregate([
        { $match: { user_id: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total_credits: { $sum: '$credits_used' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        user,
        subscription: currentSubscription,
        stats: {
          credits: creditStats,
          generations: generationStats
        }
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

// 更新用户信息
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // 检查权限：用户只能更新自己的信息，管理员可以更新任何用户
    if (req.userType !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: '无权修改此用户信息'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 限制普通用户可以更新的字段
    const allowedUpdates = ['username', 'email', 'phone', 'avatar_url', 'wechat_id', 'business_type', 'wechat_id'];
    const adminOnlyUpdates = ['is_active', 'role', 'credits_balance', 'membership', 'status'];
    const restrictedFields = ['phone', 'email', 'wechat_id', 'business_type']; // 30天限制字段
    
    // 处理前端传来的字段名映射
    const fieldMapping = {
      'wechat_id': 'wechat_id',
      'credits': 'credits_balance',
      'membership': 'role',
      'status': 'is_active'
    };
    
    // 映射前端字段名到后端字段名
    const mappedUpdates = {};
    Object.keys(updates).forEach(key => {
      const backendKey = fieldMapping[key] || key;
      mappedUpdates[backendKey] = updates[key];
    });
    updates = mappedUpdates;
    
    if (req.userType !== 'admin') {
      // 移除普通用户不能修改的字段
      Object.keys(updates).forEach(key => {
        if (!allowedUpdates.includes(key)) {
          delete updates[key];
        }
      });

      // 用户可以单独更新任何字段
      const updateKeys = Object.keys(updates);
      if (updateKeys.length === 1) {
        const [onlyField] = updateKeys;
        if (!allowedUpdates.includes(onlyField)) {
          delete updates[onlyField];
        }
      }

      // 检查30天修改限制（仅对普通用户）
      const hasRestrictedUpdates = Object.keys(updates).some(key => 
        restrictedFields.includes(key) && updates[key] !== user[key]
      );

      if (hasRestrictedUpdates) {
        const canUpdateResult = user.canUpdateProfile();
        if (!canUpdateResult.canUpdate) {
          return res.status(400).json({
            success: false,
            message: canUpdateResult.message,
            data: {
              remainingDays: canUpdateResult.remainingDays,
              lastUpdated: user.profile_last_updated
            }
          });
        }
      }
    } else {
      // 管理员可以更新所有字段，但需要处理字段映射
      const adminAllowedUpdates = [...allowedUpdates, ...adminOnlyUpdates];
      Object.keys(updates).forEach(key => {
        if (!adminAllowedUpdates.includes(key)) {
          delete updates[key];
        }
      });
    }

    // 检查用户名是否已存在
    if (updates.username && updates.username !== user.username) {
      const existingUser = await User.findOne({ 
        username: updates.username,
        _id: { $ne: id }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名已被使用'
        });
      }
    }

    // 检查邮箱是否已存在
    if (updates.email && updates.email !== user.email) {
      const existingUser = await User.findOne({ 
        email: updates.email,
        _id: { $ne: id }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '邮箱已被使用'
        });
      }
    }

    // 检查手机号是否已存在
    if (updates.phone && updates.phone !== user.phone) {
      const existingUser = await User.findOne({ 
        phone: updates.phone,
        _id: { $ne: id }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '手机号已被使用'
        });
      }
    }

    // 使用自定义方法更新用户信息并记录历史
    const updatedFields = user.updateProfileWithHistory(updates);
    await user.save();

    // 重新查询用户信息，排除敏感字段
    const updatedUser = await User.findById(id)
      .select('-password_hash -reset_password_token -email_verification_token');

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: { 
        user: updatedUser,
        updatedFields,
        nextUpdateAvailable: updatedFields.length > 0 ? 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '更新用户信息失败'
    });
  }
};

// 删除用户（软删除）
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 禁用用户账户而不是真正删除
    user.is_active = false;
    await user.save();

    res.json({
      success: true,
      message: '用户已被禁用'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败'
    });
  }
};

// 获取用户积分记录
const getUserCreditRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, type = '' } = req.query;
    
    // 检查权限
    if (req.userType !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: '无权查看此用户的积分记录'
      });
    }

    const query = { user_id: id };
    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;
    
    const [records, total] = await Promise.all([
      CreditRecord.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user_id', 'username email'),
      CreditRecord.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user credit records error:', error);
    res.status(500).json({
      success: false,
      message: '获取积分记录失败'
    });
  }
};

// 获取用户生成历史
const getUserGenerations = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status = '' } = req.query;
    
    // 检查权限
    if (req.userType !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: '无权查看此用户的生成记录'
      });
    }

    const query = { user_id: id };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const [generations, total] = await Promise.all([
      AIGeneration.find(query)
        .populate('tool_id', 'name type')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AIGeneration.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        generations,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user generations error:', error);
    res.status(500).json({
      success: false,
      message: '获取生成记录失败'
    });
  }
};

// 调整用户积分（管理员）
const adjustUserCredits = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, description } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 记录积分变动前的余额
    const balanceBefore = user.credits_balance;
    
    // 调整积分
    if (type === 'add') {
      await user.addCredits(amount);
    } else if (type === 'deduct') {
      const success = await user.deductCredits(amount);
      if (!success) {
        return res.status(400).json({
          success: false,
          message: '积分余额不足'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: '无效的操作类型'
      });
    }

    // 创建积分记录
    await CreditRecord.create({
      user_id: id,
      type: type === 'add' ? 'bonus' : 'penalty',
      amount: type === 'add' ? amount : -amount,
      balance_before: balanceBefore,
      balance_after: user.credits_balance,
      description: description || `管理员${type === 'add' ? '增加' : '扣除'}积分`,
      metadata: {
        admin_operation: {
          admin_id: req.user._id,
          admin_username: req.user.username,
          operation_type: type,
          reason: description
        }
      }
    });

    res.json({
      success: true,
      message: `积分${type === 'add' ? '增加' : '扣除'}成功`,
      data: {
        user_id: id,
        amount: type === 'add' ? amount : -amount,
        balance_before: balanceBefore,
        balance_after: user.credits_balance
      }
    });
  } catch (error) {
    console.error('Adjust user credits error:', error);
    res.status(500).json({
      success: false,
      message: '调整积分失败'
    });
  }
};

// 获取用户统计信息
const getUserStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await User.aggregate([
      {
        $facet: {
          // 总用户数
          total: [
            { $count: "count" }
          ],
          // 活跃用户数
          active: [
            { $match: { is_active: true } },
            { $count: "count" }
          ],
          // 新注册用户（按天）
          newUsers: [
            {
              $match: {
                created_at: { $gte: startDate }
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$created_at"
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { "_id": 1 } }
          ],
          // 用户角色分布
          roleDistribution: [
            {
              $group: {
                _id: "$role",
                count: { $sum: 1 }
              }
            }
          ],
          // 积分分布
          creditDistribution: [
            {
              $bucket: {
                groupBy: "$credit_balance",
                boundaries: [0, 100, 500, 1000, 5000, 10000],
                default: "10000+",
                output: {
                  count: { $sum: 1 },
                  avg_credits: { $avg: "$credit_balance" }
                }
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户统计失败'
    });
  }
};

// 获取用户订阅信息
const getUserSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查权限
    if (req.userType !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: '无权查看此用户的订阅信息'
      });
    }

    const subscription = await Subscription.getCurrentSubscription(id);
    
    res.json({
      success: true,
      data: { subscription }
    });
  } catch (error) {
    console.error('Get user subscription error:', error);
    res.status(500).json({
      success: false,
      message: '获取订阅信息失败'
    });
  }
};

// 批量操作用户
const batchUpdateUsers = async (req, res) => {
  try {
    const { user_ids, action, data } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '用户ID列表不能为空'
      });
    }

    let updateData = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateData = { is_active: true };
        message = '用户已批量激活';
        break;
      case 'deactivate':
        updateData = { is_active: false };
        message = '用户已批量禁用';
        break;
      case 'update_role':
        if (!data.role) {
          return res.status(400).json({
            success: false,
            message: '角色参数缺失'
          });
        }
        updateData = { role: data.role };
        message = '用户角色已批量更新';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '无效的操作类型'
        });
    }

    const result = await User.updateMany(
      { _id: { $in: user_ids } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message,
      data: {
        matched_count: result.matchedCount,
        modified_count: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Batch update users error:', error);
    res.status(500).json({
      success: false,
      message: '批量操作失败'
    });
  }
};

// 上传用户头像
const uploadAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查权限：用户只能上传自己的头像，管理员可以上传任何用户的头像
    if (req.userType !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: '无权修改此用户头像'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的头像文件'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 生成文件名
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `avatar_${id}_${Date.now()}${fileExtension}`;
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    const filePath = path.join(uploadDir, fileName);

    // 确保上传目录存在
    try {
      await fs.access(uploadDir);
    } catch (error) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // 保存文件
    await fs.writeFile(filePath, req.file.buffer);

    // 生成访问URL
    const avatarUrl = `/uploads/avatars/${fileName}`;

    // 删除旧头像文件（如果存在）
    if (user.avatar_url && user.avatar_url.startsWith('/uploads/avatars/')) {
      const oldFilePath = path.join(__dirname, '../../', user.avatar_url);
      try {
        await fs.unlink(oldFilePath);
      } catch (error) {
        console.warn('删除旧头像文件失败:', error.message);
      }
    }

    // 更新用户头像URL
    user.avatar_url = avatarUrl;
    await user.save();

    res.json({
      success: true,
      message: '头像上传成功',
      data: {
        avatar_url: avatarUrl,
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: '头像上传失败'
    });
  }
};

// 检查用户是否可以修改资料
const checkProfileUpdatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查权限：用户只能检查自己的信息，管理员可以检查任何用户
    let targetUserId = id;

    if (req.userType !== 'admin') {
      const requesterId = req.user._id?.toString?.() || String(req.user._id);
      if (requesterId !== id) {
        return res.status(403).json({
          success: false,
          message: '无权查看此用户信息'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: '用户ID格式无效'
        });
      }

      targetUserId = requesterId;
    } else if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '用户ID格式无效'
      });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const canUpdateResult = user.canUpdateProfile();

    res.json({
      success: true,
      data: {
        canUpdate: canUpdateResult.canUpdate,
        message: canUpdateResult.message,
        remainingDays: canUpdateResult.remainingDays || 0,
        lastUpdated: user.profile_last_updated,
        nextUpdateAvailable: user.profile_last_updated ?
          new Date(user.profile_last_updated.getTime() + 30 * 24 * 60 * 60 * 1000) : null,
        updateHistory: user.profile_update_history.slice(-5) // 最近5次修改记录
      }
    });
  } catch (error) {
    console.error('Check profile update permission error:', error);
    res.status(500).json({
      success: false,
      message: '检查修改权限失败'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserCreditRecords,
  getUserGenerations,
  adjustUserCredits,
  getUserStats,
  getUserSubscription,
  batchUpdateUsers,
  uploadAvatar,
  checkProfileUpdatePermission
};