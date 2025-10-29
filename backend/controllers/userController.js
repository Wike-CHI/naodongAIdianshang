const User = require('../models/User');
const CreditRecord = require('../models/CreditRecord');
const Subscription = require('../models/Subscription');
const AIGeneration = require('../models/AIGeneration');

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

    // 限制普通用户可以更新的字段
    const allowedUpdates = ['username', 'avatar_url'];
    const adminOnlyUpdates = ['is_active', 'role', 'credit_balance'];
    
    if (req.userType !== 'admin') {
      // 移除普通用户不能修改的字段
      Object.keys(updates).forEach(key => {
        if (!allowedUpdates.includes(key)) {
          delete updates[key];
        }
      });
    }

    // 检查用户名是否已存在
    if (updates.username) {
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

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password_hash -reset_password_token -email_verification_token');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
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
    const balanceBefore = user.credit_balance;
    
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
      balance_after: user.credit_balance,
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
        balance_after: user.credit_balance
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
  batchUpdateUsers
};