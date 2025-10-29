const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const User = require('../models/User');
const CreditRecord = require('../models/CreditRecord');

// 获取订阅套餐列表
const getSubscriptionPlans = async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;
    
    let query = {};
    if (active_only === 'true') {
      query.is_active = true;
    }

    const plans = await SubscriptionPlan.find(query).sort({ sort_order: 1, price: 1 });

    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      message: '获取订阅套餐失败'
    });
  }
};

// 创建订阅套餐
const createSubscriptionPlan = async (req, res) => {
  try {
    const planData = req.body;
    
    const plan = new SubscriptionPlan(planData);
    await plan.save();

    res.status(201).json({
      success: true,
      message: '订阅套餐创建成功',
      data: { plan }
    });
  } catch (error) {
    console.error('Create subscription plan error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      success: false,
      message: '创建订阅套餐失败'
    });
  }
};

// 更新订阅套餐
const updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '订阅套餐不存在'
      });
    }

    res.json({
      success: true,
      message: '订阅套餐更新成功',
      data: { plan }
    });
  } catch (error) {
    console.error('Update subscription plan error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      success: false,
      message: '更新订阅套餐失败'
    });
  }
};

// 删除订阅套餐
const deleteSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否有用户正在使用此套餐
    const activeSubscriptions = await Subscription.countDocuments({
      plan_id: id,
      status: 'active'
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        message: `无法删除套餐，还有 ${activeSubscriptions} 个活跃订阅`
      });
    }

    const plan = await SubscriptionPlan.findByIdAndDelete(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '订阅套餐不存在'
      });
    }

    res.json({
      success: true,
      message: '订阅套餐删除成功'
    });
  } catch (error) {
    console.error('Delete subscription plan error:', error);
    res.status(500).json({
      success: false,
      message: '删除订阅套餐失败'
    });
  }
};

// 获取用户订阅列表
const getUserSubscriptions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = '', 
      user_id = '',
      plan_id = '' 
    } = req.query;
    
    const query = {};
    
    // 权限控制：普通用户只能看到自己的订阅
    if (req.userType !== 'admin') {
      query.user_id = req.user._id;
    } else if (user_id) {
      query.user_id = user_id;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (plan_id) {
      query.plan_id = plan_id;
    }

    const skip = (page - 1) * limit;
    
    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .populate('user_id', 'username email')
        .populate('plan_id', 'name price duration')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Subscription.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: '获取订阅记录失败'
    });
  }
};

// 创建订阅
const createSubscription = async (req, res) => {
  try {
    const { plan_id, payment_method, transaction_id, auto_renew = true } = req.body;
    const userId = req.user._id;

    // 获取套餐信息
    const plan = await SubscriptionPlan.findById(plan_id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '订阅套餐不存在'
      });
    }

    if (!plan.is_active) {
      return res.status(400).json({
        success: false,
        message: '订阅套餐已停用'
      });
    }

    // 检查用户是否已有活跃订阅
    const existingSubscription = await Subscription.getCurrentSubscription(userId);
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: '您已有活跃的订阅，请先取消当前订阅'
      });
    }

    // 计算订阅时间
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    // 检查是否为年度会员套餐
    let grantedCredits = plan.benefits.monthly_credits || 0;
    let isYearlyMember = false;
    let yearlyCreditsGranted = 0;
    
    if (plan.isYearlyPlan()) {
      // 年度会员套餐
      isYearlyMember = true;
      // 年度会员默认获得12个月的积分
      yearlyCreditsGranted = plan.getYearlyMemberCredits();
      grantedCredits = yearlyCreditsGranted;
      // 设置订阅时长为12个月
      endDate.setMonth(endDate.getMonth() + plan.getYearlyMemberDuration());
    } else {
      // 普通套餐
      endDate.setMonth(endDate.getMonth() + plan.duration_months);
    }

    // 创建订阅
    const subscription = new Subscription({
      user_id: userId,
      plan_id,
      start_date: startDate,
      end_date: endDate,
      status: 'active',
      payment_amount: plan.isYearlyPlan() ? plan.getYearlyMemberPrice() : plan.actual_price,
      currency: plan.currency,
      payment_method,
      transaction_id,
      auto_renew,
      granted_credits: grantedCredits,
      is_yearly_member: isYearlyMember,
      yearly_credits_granted: yearlyCreditsGranted
    });

    await subscription.save();

    // 给用户添加积分
    let creditsToAdd = plan.benefits.monthly_credits;
    if (plan.isYearlyPlan()) {
      // 年度会员获得12个月的积分
      creditsToAdd = plan.getYearlyMemberCredits();
    }
    
    if (creditsToAdd > 0) {
      const user = await User.findById(userId);
      await user.addCredits(creditsToAdd);

      // 创建积分记录
      await CreditRecord.create({
        user_id: userId,
        type: 'subscription',
        amount: creditsToAdd,
        balance_before: user.credit_balance - creditsToAdd,
        balance_after: user.credit_balance,
        description: plan.isYearlyPlan() ? 
          `年度会员套餐赠送积分: ${plan.name}` : 
          `订阅套餐赠送积分: ${plan.name}`,
        metadata: {
          subscription_id: subscription._id,
          plan_id,
          plan_name: plan.name
        }
      });
    }

    // 更新用户角色（如果套餐包含高级权限）
    if (plan.benefits.priority_processing || plan.benefits.advanced_features) {
      await User.findByIdAndUpdate(userId, { role: 'premium' });
    }

    res.status(201).json({
      success: true,
      message: '订阅创建成功',
      data: { subscription }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: '创建订阅失败'
    });
  }
};

// 取消订阅
const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = '', immediate = false } = req.body;
    
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: '订阅不存在'
      });
    }

    // 权限检查
    if (req.userType !== 'admin' && subscription.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权取消此订阅'
      });
    }

    await subscription.cancel(reason, immediate);

    // 如果立即取消，更新用户角色
    if (immediate) {
      const user = await User.findById(subscription.user_id);
      const hasOtherActiveSubscription = await Subscription.getCurrentSubscription(subscription.user_id);
      
      if (!hasOtherActiveSubscription) {
        await User.findByIdAndUpdate(subscription.user_id, { role: 'user' });
      }
    }

    res.json({
      success: true,
      message: immediate ? '订阅已立即取消' : '订阅将在到期后取消'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: '取消订阅失败'
    });
  }
};

// 续费订阅
const renewSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method, transaction_id } = req.body;
    
    const subscription = await Subscription.findById(id).populate('plan_id');
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: '订阅不存在'
      });
    }

    // 权限检查
    if (req.userType !== 'admin' && subscription.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权续费此订阅'
      });
    }

    if (!['expired', 'cancelled'].includes(subscription.status)) {
      return res.status(400).json({
        success: false,
        message: '只能续费已过期或已取消的订阅'
      });
    }

    await subscription.renew(payment_method, transaction_id);

    // 给用户添加积分
    let creditsToAdd = subscription.plan_id.benefits.monthly_credits;
    const plan = subscription.plan_id;
    
    if (plan.isYearlyPlan()) {
      // 年度会员获得12个月的积分
      creditsToAdd = plan.getYearlyMemberCredits();
    }
    
    if (creditsToAdd > 0) {
      const user = await User.findById(subscription.user_id);
      await user.addCredits(creditsToAdd);

      // 创建积分记录
      await CreditRecord.create({
        user_id: subscription.user_id,
        type: 'subscription',
        amount: creditsToAdd,
        balance_before: user.credit_balance - creditsToAdd,
        balance_after: user.credit_balance,
        description: plan.isYearlyPlan() ? 
          `年度会员续费赠送积分: ${plan.name}` : 
          `订阅续费赠送积分: ${plan.name}`,
        metadata: {
          subscription_id: subscription._id,
          plan_id: plan._id,
          plan_name: plan.name
        }
      });
    }

    res.json({
      success: true,
      message: '订阅续费成功'
    });
  } catch (error) {
    console.error('Renew subscription error:', error);
    res.status(500).json({
      success: false,
      message: '续费订阅失败'
    });
  }
};

// 获取订阅统计
const getSubscriptionStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const stats = await Subscription.getSubscriptionStats(parseInt(days));

    // 获取套餐统计
    const planStats = await SubscriptionPlan.aggregate([
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'plan_id',
          as: 'subscriptions'
        }
      },
      {
        $project: {
          name: 1,
          price: 1,
          total_subscriptions: { $size: '$subscriptions' },
          active_subscriptions: {
            $size: {
              $filter: {
                input: '$subscriptions',
                cond: { $eq: ['$$this.status', 'active'] }
              }
            }
          },
          revenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$subscriptions',
                    cond: { $eq: ['$$this.status', 'active'] }
                  }
                },
                as: 'sub',
                in: '$$sub.payment_amount'
              }
            }
          }
        }
      },
      { $sort: { active_subscriptions: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        subscription_stats: stats,
        plan_stats: planStats
      }
    });
  } catch (error) {
    console.error('Get subscription stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取订阅统计失败'
    });
  }
};

// 获取即将到期的订阅
const getExpiringSubscriptions = async (req, res) => {
  try {
    const { days = 7, limit = 50 } = req.query;
    
    const subscriptions = await Subscription.getExpiringSubscriptions(parseInt(days), parseInt(limit));

    res.json({
      success: true,
      data: { subscriptions }
    });
  } catch (error) {
    console.error('Get expiring subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: '获取即将到期订阅失败'
    });
  }
};

// 批量操作订阅
const batchUpdateSubscriptions = async (req, res) => {
  try {
    const { subscription_ids, action } = req.body;
    
    if (!subscription_ids || !Array.isArray(subscription_ids) || subscription_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '订阅ID列表不能为空'
      });
    }

    let query = { _id: { $in: subscription_ids } };
    
    // 普通用户只能操作自己的订阅
    if (req.userType !== 'admin') {
      query.user_id = req.user._id;
    }

    let result;
    let message = '';

    switch (action) {
      case 'cancel':
        result = await Subscription.updateMany(
          { ...query, status: 'active' },
          { 
            $set: { 
              status: 'cancelled',
              'cancellation.cancelled_at': new Date(),
              'cancellation.reason': '批量取消'
            }
          }
        );
        message = '订阅已批量取消';
        break;
      case 'pause':
        result = await Subscription.updateMany(
          { ...query, status: 'active' },
          { $set: { status: 'paused' } }
        );
        message = '订阅已批量暂停';
        break;
      case 'resume':
        result = await Subscription.updateMany(
          { ...query, status: 'paused' },
          { $set: { status: 'active' } }
        );
        message = '订阅已批量恢复';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '无效的操作类型'
        });
    }

    res.json({
      success: true,
      message,
      data: {
        matched_count: result.matchedCount,
        modified_count: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Batch update subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: '批量操作失败'
    });
  }
};

module.exports = {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getUserSubscriptions,
  createSubscription,
  cancelSubscription,
  renewSubscription,
  getSubscriptionStats,
  getExpiringSubscriptions,
  batchUpdateSubscriptions
};