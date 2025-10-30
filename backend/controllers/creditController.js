const mongoose = require('mongoose');
const CreditRecord = require('../models/CreditRecord');
const User = require('../models/User');

// 获取积分记录列表
const getCreditRecords = async (req, res) => {
  try {
    const { page = 1, limit = 20, type = '' } = req.query;

    const rawUserId = req.userType === 'admin' && req.query.user_id
      ? req.query.user_id
      : req.user?._id;

    const normalizedUserId = rawUserId instanceof mongoose.Types.ObjectId
      ? rawUserId.toString()
      : String(rawUserId || '');

    if (!mongoose.Types.ObjectId.isValid(normalizedUserId)) {
      return res.status(400).json({
        success: false,
        message: '无效的用户ID'
      });
    }

    const targetObjectId = new mongoose.Types.ObjectId(normalizedUserId);

    const query = { user_id: targetObjectId };
    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      CreditRecord.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
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
    console.error('Get credit records error:', error);
    res.status(500).json({
      success: false,
      message: '获取积分记录失败'
    });
  }
};

// 管理员调整用户积分
const adjustUserCredits = async (req, res) => {
  try {
    const { user_id, amount, type, description } = req.body;
    
    const user = await User.findById(user_id);
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
      user_id: user_id,
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
        user_id: user_id,
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

// 获取积分统计
const getCreditStats = async (req, res) => {
  try {
    const rawUserId = req.userType === 'admin' && req.query.user_id
      ? req.query.user_id
      : req.user?._id;

    const normalizedUserId = rawUserId instanceof mongoose.Types.ObjectId
      ? rawUserId.toString()
      : String(rawUserId || '');

    if (!mongoose.Types.ObjectId.isValid(normalizedUserId)) {
      return res.status(400).json({
        success: false,
        message: '无效的用户ID'
      });
    }

    const targetObjectId = new mongoose.Types.ObjectId(normalizedUserId);

    const stats = await CreditRecord.aggregate([
      {
        $match: { user_id: targetObjectId }
      },
      {
        $group: {
          _id: '$type',
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { total_amount: -1 }
      }
    ]);

    const recentActivity = await CreditRecord.find({ user_id: targetObjectId })
      .sort({ created_at: -1 })
      .limit(10)
      .populate('user_id', 'username');

    res.json({
      success: true,
      data: {
        stats,
        recent_activity: recentActivity
      }
    });
  } catch (error) {
    console.error('Get credit stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取积分统计失败'
    });
  }
};

// 获取积分类型统计
const getCreditTypeStats = async (req, res) => {
  try {
    const rawUserId = req.userType === 'admin' && req.query.user_id
      ? req.query.user_id
      : req.user?._id;

    const normalizedUserId = rawUserId instanceof mongoose.Types.ObjectId
      ? rawUserId.toString()
      : String(rawUserId || '');

    if (!mongoose.Types.ObjectId.isValid(normalizedUserId)) {
      return res.status(400).json({
        success: false,
        message: '无效的用户ID'
      });
    }

    const targetObjectId = new mongoose.Types.ObjectId(normalizedUserId);

    const stats = await CreditRecord.aggregate([
      {
        $match: { user_id: targetObjectId }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          total_amount: { $sum: '$amount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get credit type stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取积分类型统计失败'
    });
  }
};

// 获取积分排行榜
const getCreditLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({ is_active: true })
      .sort({ credit_balance: -1 })
      .limit(50)
      .select('username credit_balance');

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Get credit leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: '获取积分排行榜失败'
    });
  }
};

// 获取积分余额
const getCreditBalance = async (req, res) => {
  try {
    const targetUserId = req.userType === 'admin' && req.query.user_id
      ? req.query.user_id
      : req.user._id;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: '无效的用户ID'
      });
    }

    const user = await User.findById(targetUserId).select('credits_balance username email');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        user_id: user._id,
        username: user.username,
        credits_balance: user.credits_balance
      }
    });
  } catch (error) {
    console.error('Get credit balance error:', error);
    res.status(500).json({
      success: false,
      message: '获取积分余额失败'
    });
  }
};

// 导出积分记录
const exportCreditRecords = async (req, res) => {
  try {
    const records = await CreditRecord.find()
      .sort({ created_at: -1 })
      .populate('user_id', 'username');
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Export credit records error:', error);
    res.status(500).json({
      success: false,
      message: '导出积分记录失败'
    });
  }
};

// 批量调整用户积分（管理员）
const batchAdjustCredits = async (req, res) => {
  try {
    const { adjustments } = req.body; // [{ user_id, amount, type, description }]
    
    if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
      return res.status(400).json({
        success: false,
        message: '调整列表不能为空'
      });
    }

    const results = [];
    
    for (const adjustment of adjustments) {
      try {
        const { user_id, amount, type, description } = adjustment;
        
        const user = await User.findById(user_id);
        if (!user) {
          results.push({
            user_id,
            success: false,
            message: '用户不存在'
          });
          continue;
        }

        // 记录积分变动前的余额
        const balanceBefore = user.credit_balance;
        
        // 调整积分
        if (type === 'add') {
          await user.addCredits(amount);
        } else if (type === 'deduct') {
          const success = await user.deductCredits(amount);
          if (!success) {
            results.push({
              user_id,
              success: false,
              message: '积分余额不足'
            });
            continue;
          }
        } else {
          results.push({
            user_id,
            success: false,
            message: '无效的操作类型'
          });
          continue;
        }

        // 创建积分记录
        await CreditRecord.create({
          user_id: user_id,
          type: type === 'add' ? 'bonus' : 'penalty',
          amount: type === 'add' ? amount : -amount,
          balance_before: balanceBefore,
          balance_after: user.credit_balance,
          description: description || `管理员批量${type === 'add' ? '增加' : '扣除'}积分`,
          metadata: {
            admin_operation: {
              admin_id: req.user._id,
              admin_username: req.user.username,
              operation_type: type,
              reason: description
            }
          }
        });

        results.push({
          user_id,
          success: true,
          message: `积分${type === 'add' ? '增加' : '扣除'}成功`,
          balance_after: user.credit_balance
        });
      } catch (error) {
        console.error('Batch adjust credits error for user:', adjustment.user_id, error);
        results.push({
          user_id: adjustment.user_id,
          success: false,
          message: '调整积分时发生错误'
        });
      }
    }

    res.json({
      success: true,
      message: '批量调整积分完成',
      data: results
    });
  } catch (error) {
    console.error('Batch adjust credits error:', error);
    res.status(500).json({
      success: false,
      message: '批量调整积分失败'
    });
  }
};

module.exports = {
  getCreditRecords,
  getCreditBalance,
  adjustUserCredits,
  getCreditStats,
  getCreditTypeStats,
  getCreditLeaderboard,
  exportCreditRecords,
  batchAdjustCredits
};