const { SubscriptionPlan, Subscription, User } = require('../models');

class SubscriptionController {
  // 获取所有订阅套餐
  async getPlans(req, res) {
    try {
      const plans = await SubscriptionPlan.getActivePlans();
      
      res.json({
        success: true,
        data: { plans }
      });
    } catch (error) {
      console.error('获取订阅套餐错误:', error);
      res.status(500).json({
        success: false,
        message: '获取订阅套餐失败'
      });
    }
  }

  // 获取用户当前订阅
  async getUserSubscription(req, res) {
    try {
      const userId = req.user._id;
      
      const subscription = await Subscription.getUserActiveSubscription(userId);
      
      res.json({
        success: true,
        data: { subscription }
      });
    } catch (error) {
      console.error('获取用户订阅错误:', error);
      res.status(500).json({
        success: false,
        message: '获取订阅信息失败'
      });
    }
  }

  // 创建订阅
  async createSubscription(req, res) {
    try {
      const { plan_id, payment_method = 'alipay' } = req.body;
      const userId = req.user._id;

      if (!plan_id) {
        return res.status(400).json({
          success: false,
          message: '请选择订阅套餐'
        });
      }

      // 检查套餐是否存在
      const plan = await SubscriptionPlan.findById(plan_id);
      if (!plan || !plan.is_active) {
        return res.status(404).json({
          success: false,
          message: '订阅套餐不存在或已下架'
        });
      }

      // 检查用户是否已有活跃订阅
      const existingSubscription = await Subscription.getUserActiveSubscription(userId);
      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          message: '您已有活跃的订阅，请先取消当前订阅'
        });
      }

      // 创建订阅
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration_months);

      const subscription = new Subscription({
        user_id: userId,
        plan_id: plan_id,
        start_date: startDate,
        end_date: endDate,
        status: 'pending',
        paid_amount: plan.price,
        payment_method
      });

      await subscription.save();

      res.status(201).json({
        success: true,
        message: '订阅创建成功，请完成支付',
        data: { 
          subscription: {
            id: subscription._id,
            plan_name: plan.name,
            start_date: subscription.start_date,
            end_date: subscription.end_date,
            paid_amount: subscription.paid_amount,
            status: subscription.status
          }
        }
      });
    } catch (error) {
      console.error('创建订阅错误:', error);
      res.status(500).json({
        success: false,
        message: '创建订阅失败'
      });
    }
  }

  // 模拟订阅支付成功
  async simulateSubscriptionPayment(req, res) {
    try {
      const { subscription_id, transaction_id } = req.body;
      const userId = req.user._id;

      if (!subscription_id || !transaction_id) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      const subscription = await Subscription.findOne({
        _id: subscription_id,
        user_id: userId
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: '订阅不存在'
        });
      }

      if (subscription.status === 'active') {
        return res.status(400).json({
          success: false,
          message: '订阅已激活'
        });
      }

      // 激活订阅
      subscription.status = 'active';
      subscription.transaction_id = transaction_id;
      subscription.paid_at = new Date();
      await subscription.save();

      // 更新用户类型
      const plan = await SubscriptionPlan.findById(subscription.plan_id);
      if (plan) {
        let userType = 'free';
        if (plan.name.toLowerCase().includes('premium')) {
          userType = 'premium';
        } else if (plan.name.toLowerCase().includes('vip')) {
          userType = 'vip';
        }

        await User.findByIdAndUpdate(userId, { user_type: userType });
      }

      res.json({
        success: true,
        message: '订阅支付成功，已激活'
      });
    } catch (error) {
      console.error('订阅支付错误:', error);
      res.status(500).json({
        success: false,
        message: '订阅支付处理失败'
      });
    }
  }

  // 取消订阅
  async cancelSubscription(req, res) {
    try {
      const userId = req.user._id;

      const subscription = await Subscription.getUserActiveSubscription(userId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: '没有找到活跃的订阅'
        });
      }

      await subscription.cancel();

      // 更新用户类型为免费用户
      await User.findByIdAndUpdate(userId, { user_type: 'free' });

      res.json({
        success: true,
        message: '订阅已取消'
      });
    } catch (error) {
      console.error('取消订阅错误:', error);
      res.status(500).json({
        success: false,
        message: '取消订阅失败'
      });
    }
  }

  // 续费订阅
  async renewSubscription(req, res) {
    try {
      const { months = 1 } = req.body;
      const userId = req.user._id;

      const subscription = await Subscription.getUserActiveSubscription(userId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: '没有找到活跃的订阅'
        });
      }

      const plan = await SubscriptionPlan.findById(subscription.plan_id);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: '订阅套餐不存在'
        });
      }

      await subscription.renew(months);

      res.json({
        success: true,
        message: '订阅续费成功',
        data: {
          new_end_date: subscription.end_date,
          extended_months: months
        }
      });
    } catch (error) {
      console.error('续费订阅错误:', error);
      res.status(500).json({
        success: false,
        message: '续费订阅失败'
      });
    }
  }

  // 获取用户订阅历史
  async getUserSubscriptionHistory(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const userId = req.user._id;

      const skip = (page - 1) * limit;

      const subscriptions = await Subscription.find({ user_id: userId })
        .populate('plan_id', 'name duration_months price')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Subscription.countDocuments({ user_id: userId });

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
      console.error('获取订阅历史错误:', error);
      res.status(500).json({
        success: false,
        message: '获取订阅历史失败'
      });
    }
  }

  // 管理员：获取所有订阅套餐
  async getAllPlans(req, res) {
    try {
      const plans = await SubscriptionPlan.find().sort({ sort_order: 1 });
      
      res.json({
        success: true,
        data: { plans }
      });
    } catch (error) {
      console.error('获取所有订阅套餐错误:', error);
      res.status(500).json({
        success: false,
        message: '获取订阅套餐失败'
      });
    }
  }

  // 管理员：创建订阅套餐
  async createPlan(req, res) {
    try {
      const {
        name,
        description,
        price,
        duration_months,
        benefits,
        sort_order = 0,
        is_active = true
      } = req.body;

      if (!name || !description || !price || !duration_months) {
        return res.status(400).json({
          success: false,
          message: '请填写所有必填字段'
        });
      }

      const plan = new SubscriptionPlan({
        name,
        description,
        price,
        duration_months,
        benefits: benefits || [],
        sort_order,
        is_active
      });

      await plan.save();

      res.status(201).json({
        success: true,
        message: '订阅套餐创建成功',
        data: { plan }
      });
    } catch (error) {
      console.error('创建订阅套餐错误:', error);
      res.status(500).json({
        success: false,
        message: '创建订阅套餐失败'
      });
    }
  }

  // 管理员：更新订阅套餐
  async updatePlan(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const plan = await SubscriptionPlan.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
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
      console.error('更新订阅套餐错误:', error);
      res.status(500).json({
        success: false,
        message: '更新订阅套餐失败'
      });
    }
  }

  // 管理员：删除订阅套餐
  async deletePlan(req, res) {
    try {
      const { id } = req.params;

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
      console.error('删除订阅套餐错误:', error);
      res.status(500).json({
        success: false,
        message: '删除订阅套餐失败'
      });
    }
  }

  // 管理员：获取订阅统计
  async getSubscriptionStats(req, res) {
    try {
      const totalSubscriptions = await Subscription.countDocuments({ status: 'active' });
      const totalRevenue = await Subscription.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$paid_amount' } } }
      ]);

      // 即将到期的订阅
      const expiringSubscriptions = await Subscription.getExpiringSubscriptions(7);

      res.json({
        success: true,
        data: {
          total_active_subscriptions: totalSubscriptions,
          total_revenue: totalRevenue[0]?.total || 0,
          expiring_subscriptions_7d: expiringSubscriptions.length
        }
      });
    } catch (error) {
      console.error('获取订阅统计错误:', error);
      res.status(500).json({
        success: false,
        message: '获取订阅统计失败'
      });
    }
  }

  // 管理员：获取所有订阅记录
  async getAllSubscriptions(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        plan_id 
      } = req.query;

      const filter = {};
      if (status) filter.status = status;
      if (plan_id) filter.plan_id = plan_id;

      const skip = (page - 1) * limit;

      const subscriptions = await Subscription.find(filter)
        .populate('user_id', 'username email')
        .populate('plan_id', 'name duration_months price')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Subscription.countDocuments(filter);

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
      console.error('获取所有订阅记录错误:', error);
      res.status(500).json({
        success: false,
        message: '获取订阅记录失败'
      });
    }
  }
}

module.exports = new SubscriptionController();