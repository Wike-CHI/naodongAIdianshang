const User = require('../models/User');
const CreditRecord = require('../models/CreditRecord');

// 获取积分记录列表
const getCreditRecords = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      user_id = '', 
      type = '', 
      start_date = '', 
      end_date = '',
      sort = '-created_at'
    } = req.query;
    
    const query = {};
    
    // 用户筛选
    if (user_id) {
      query.user_id = user_id;
    }
    
    // 类型筛选
    if (type) {
      query.type = type;
    }
    
    // 日期范围筛选
    if (start_date || end_date) {
      query.created_at = {};
      if (start_date) {
        query.created_at.$gte = new Date(start_date);
      }
      if (end_date) {
        query.created_at.$lte = new Date(end_date);
      }
    }

    const skip = (page - 1) * limit;
    
    const [records, total] = await Promise.all([
      CreditRecord.find(query)
        .populate('user_id', 'username email')
        .sort(sort)
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
      message: '获取积分记录失败',
      error: error.message
    });
  }
};

// 根据ID获取积分记录
const getCreditRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await CreditRecord.findById(id)
      .populate('user_id', 'username email');
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: '积分记录不存在'
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Get credit record by ID error:', error);
    res.status(500).json({
      success: false,
      message: '获取积分记录详情失败',
      error: error.message
    });
  }
};

// 手动调整用户积分
const adjustUserCredits = async (req, res) => {
  try {
    const { user_id, amount, type, description, admin_notes } = req.body;
    
    if (!user_id || !amount || !type) {
      return res.status(400).json({
        success: false,
        message: '用户ID、金额和类型为必填项'
      });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const previousBalance = user.credits || 0;
    const newBalance = previousBalance + amount;

    if (newBalance < 0) {
      return res.status(400).json({
        success: false,
        message: '积分余额不足'
      });
    }

    // 更新用户积分
    user.credits = newBalance;
    await user.save();

    // 创建积分记录
    const creditRecord = new CreditRecord({
      user_id,
      type,
      amount,
      description: description || `管理员${amount > 0 ? '增加' : '扣除'}积分`,
      balance_before: previousBalance,
      balance_after: newBalance,
      admin_operation: {
        admin_id: req.user.id,
        admin_username: req.user.username,
        notes: admin_notes
      }
    });

    await creditRecord.save();

    res.json({
      success: true,
      message: '积分调整成功',
      data: {
        user_id,
        previous_balance: previousBalance,
        new_balance: newBalance,
        amount_changed: amount,
        record_id: creditRecord._id
      }
    });
  } catch (error) {
    console.error('Adjust user credits error:', error);
    res.status(500).json({
      success: false,
      message: '调整用户积分失败',
      error: error.message
    });
  }
};

// 获取积分统计
const getCreditStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const dateQuery = {};
    if (start_date || end_date) {
      dateQuery.created_at = {};
      if (start_date) {
        dateQuery.created_at.$gte = new Date(start_date);
      }
      if (end_date) {
        dateQuery.created_at.$lte = new Date(end_date);
      }
    }

    const [
      totalRecords,
      totalCreditsAdded,
      totalCreditsDeducted,
      typeStats,
      dailyStats
    ] = await Promise.all([
      CreditRecord.countDocuments(dateQuery),
      CreditRecord.aggregate([
        { $match: { ...dateQuery, amount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      CreditRecord.aggregate([
        { $match: { ...dateQuery, amount: { $lt: 0 } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      CreditRecord.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            total_amount: { $sum: '$amount' }
          }
        }
      ]),
      CreditRecord.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
            },
            count: { $sum: 1 },
            total_amount: { $sum: '$amount' }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total_records: totalRecords,
        total_credits_added: totalCreditsAdded[0]?.total || 0,
        total_credits_deducted: Math.abs(totalCreditsDeducted[0]?.total || 0),
        type_stats: typeStats,
        daily_stats: dailyStats
      }
    });
  } catch (error) {
    console.error('Get credit stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取积分统计失败',
      error: error.message
    });
  }
};

// 获取积分类型列表
const getCreditTypes = async (req, res) => {
  try {
    const types = await CreditRecord.distinct('type');
    
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Get credit types error:', error);
    res.status(500).json({
      success: false,
      message: '获取积分类型失败',
      error: error.message
    });
  }
};

// 批量调整积分
const batchAdjustCredits = async (req, res) => {
  try {
    const { adjustments, admin_notes } = req.body;
    
    if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的调整列表'
      });
    }

    const results = [];
    const errors = [];

    for (const adjustment of adjustments) {
      try {
        const { user_id, amount, type, description } = adjustment;
        
        const user = await User.findById(user_id);
        if (!user) {
          errors.push({ user_id, error: '用户不存在' });
          continue;
        }

        const previousBalance = user.credits || 0;
        const newBalance = previousBalance + amount;

        if (newBalance < 0) {
          errors.push({ user_id, error: '积分余额不足' });
          continue;
        }

        // 更新用户积分
        user.credits = newBalance;
        await user.save();

        // 创建积分记录
        const creditRecord = new CreditRecord({
          user_id,
          type,
          amount,
          description: description || `批量${amount > 0 ? '增加' : '扣除'}积分`,
          balance_before: previousBalance,
          balance_after: newBalance,
          admin_operation: {
            admin_id: req.user.id,
            admin_username: req.user.username,
            notes: admin_notes
          }
        });

        await creditRecord.save();

        results.push({
          user_id,
          previous_balance: previousBalance,
          new_balance: newBalance,
          amount_changed: amount,
          record_id: creditRecord._id
        });
      } catch (error) {
        errors.push({ user_id: adjustment.user_id, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `批量调整完成，成功 ${results.length} 个，失败 ${errors.length} 个`,
      data: {
        successful: results,
        failed: errors
      }
    });
  } catch (error) {
    console.error('Batch adjust credits error:', error);
    res.status(500).json({
      success: false,
      message: '批量调整积分失败',
      error: error.message
    });
  }
};

// 导出积分记录
const exportCreditRecords = async (req, res) => {
  try {
    const { 
      user_id = '', 
      type = '', 
      start_date = '', 
      end_date = '',
      format = 'csv'
    } = req.query;
    
    const query = {};
    
    if (user_id) query.user_id = user_id;
    if (type) query.type = type;
    if (start_date || end_date) {
      query.created_at = {};
      if (start_date) query.created_at.$gte = new Date(start_date);
      if (end_date) query.created_at.$lte = new Date(end_date);
    }

    const records = await CreditRecord.find(query)
      .populate('user_id', 'username email')
      .sort({ created_at: -1 });

    if (format === 'csv') {
      const csvData = records.map(record => ({
        '记录ID': record._id,
        '用户名': record.user_id?.username || '',
        '邮箱': record.user_id?.email || '',
        '类型': record.type,
        '金额': record.amount,
        '描述': record.description,
        '操作前余额': record.balance_before,
        '操作后余额': record.balance_after,
        '创建时间': record.created_at.toISOString()
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=credit_records.csv');
      
      // 简单的CSV格式化
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n');
      
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        data: records
      });
    }
  } catch (error) {
    console.error('Export credit records error:', error);
    res.status(500).json({
      success: false,
      message: '导出积分记录失败',
      error: error.message
    });
  }
};

module.exports = {
  getCreditRecords,
  getCreditRecordById,
  adjustUserCredits,
  getCreditStats,
  getCreditTypes,
  batchAdjustCredits,
  exportCreditRecords
};