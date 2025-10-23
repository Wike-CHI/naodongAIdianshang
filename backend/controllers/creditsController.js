const { UserCredits, CreditPackage, CreditOrder } = require('../models');

class CreditsController {
  // 获取用户积分信息
  async getUserCredits(req, res) {
    try {
      const userId = req.user._id;
      
      const credits = await UserCredits.findOne({ user_id: userId });
      if (!credits) {
        return res.status(404).json({
          success: false,
          message: '积分信息不存在'
        });
      }

      res.json({
        success: true,
        data: { credits }
      });
    } catch (error) {
      console.error('获取用户积分错误:', error);
      res.status(500).json({
        success: false,
        message: '获取积分信息失败'
      });
    }
  }

  // 获取积分充值套餐
  async getCreditPackages(req, res) {
    try {
      const packages = await CreditPackage.getActivePackages();
      
      res.json({
        success: true,
        data: { packages }
      });
    } catch (error) {
      console.error('获取积分套餐错误:', error);
      res.status(500).json({
        success: false,
        message: '获取积分套餐失败'
      });
    }
  }

  // 创建积分充值订单
  async createCreditOrder(req, res) {
    try {
      const { package_id, payment_method = 'alipay' } = req.body;
      const userId = req.user._id;

      if (!package_id) {
        return res.status(400).json({
          success: false,
          message: '请选择充值套餐'
        });
      }

      // 获取套餐信息
      const creditPackage = await CreditPackage.findById(package_id);
      if (!creditPackage || !creditPackage.is_active) {
        return res.status(404).json({
          success: false,
          message: '充值套餐不存在或已下架'
        });
      }

      // 创建订单
      const order = new CreditOrder({
        user_id: userId,
        package_id: package_id,
        credits_purchased: creditPackage.getTotalCredits(),
        paid_amount: creditPackage.price,
        payment_method,
        payment_status: 'pending'
      });

      await order.save();

      res.status(201).json({
        success: true,
        message: '订单创建成功',
        data: { 
          order: {
            id: order._id,
            order_no: order.order_no,
            credits_purchased: order.credits_purchased,
            paid_amount: order.paid_amount,
            payment_method: order.payment_method,
            payment_status: order.payment_status
          }
        }
      });
    } catch (error) {
      console.error('创建积分订单错误:', error);
      res.status(500).json({
        success: false,
        message: '创建订单失败'
      });
    }
  }

  // 获取用户积分订单历史
  async getUserOrders(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const userId = req.user._id;

      const filter = { user_id: userId };
      if (status) filter.payment_status = status;

      const skip = (page - 1) * limit;

      const orders = await CreditOrder.find(filter)
        .populate('package_id', 'name credits_amount bonus_credits')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await CreditOrder.countDocuments(filter);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(total / limit),
            total_items: total,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('获取订单历史错误:', error);
      res.status(500).json({
        success: false,
        message: '获取订单历史失败'
      });
    }
  }

  // 模拟支付成功回调（实际项目中应该是支付平台的回调）
  async simulatePaymentSuccess(req, res) {
    try {
      const { order_id, transaction_id } = req.body;

      if (!order_id || !transaction_id) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      const order = await CreditOrder.findById(order_id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      if (order.payment_status === 'paid') {
        return res.status(400).json({
          success: false,
          message: '订单已支付'
        });
      }

      // 更新订单状态
      await order.markAsPaid(transaction_id);

      // 增加用户积分
      const userCredits = await UserCredits.findOne({ user_id: order.user_id });
      if (userCredits) {
        await userCredits.addCredits(order.credits_purchased, 'purchase');
      }

      res.json({
        success: true,
        message: '支付成功，积分已到账'
      });
    } catch (error) {
      console.error('支付回调错误:', error);
      res.status(500).json({
        success: false,
        message: '支付处理失败'
      });
    }
  }

  // 消费积分
  async consumeCredits(req, res) {
    try {
      const { amount, description } = req.body;
      const userId = req.user._id;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: '消费积分数量无效'
        });
      }

      const userCredits = await UserCredits.findOne({ user_id: userId });
      if (!userCredits) {
        return res.status(404).json({
          success: false,
          message: '积分账户不存在'
        });
      }

      if (!userCredits.hasEnoughCredits(amount)) {
        return res.status(400).json({
          success: false,
          message: '积分余额不足'
        });
      }

      await userCredits.consumeCredits(amount, description || 'AI工具使用');

      res.json({
        success: true,
        message: '积分消费成功',
        data: {
          consumed_credits: amount,
          remaining_credits: userCredits.current_credits
        }
      });
    } catch (error) {
      console.error('消费积分错误:', error);
      res.status(500).json({
        success: false,
        message: '积分消费失败'
      });
    }
  }

  // 管理员：获取所有积分套餐
  async getAllPackages(req, res) {
    try {
      const packages = await CreditPackage.find().sort({ sort_order: 1 });
      
      res.json({
        success: true,
        data: { packages }
      });
    } catch (error) {
      console.error('获取所有积分套餐错误:', error);
      res.status(500).json({
        success: false,
        message: '获取积分套餐失败'
      });
    }
  }

  // 管理员：创建积分套餐
  async createPackage(req, res) {
    try {
      const {
        name,
        credits_amount,
        price,
        bonus_credits = 0,
        description,
        sort_order = 0,
        is_active = true
      } = req.body;

      if (!name || !credits_amount || !price) {
        return res.status(400).json({
          success: false,
          message: '请填写所有必填字段'
        });
      }

      const creditPackage = new CreditPackage({
        name,
        credits_amount,
        price,
        bonus_credits,
        description,
        sort_order,
        is_active
      });

      await creditPackage.save();

      res.status(201).json({
        success: true,
        message: '积分套餐创建成功',
        data: { package: creditPackage }
      });
    } catch (error) {
      console.error('创建积分套餐错误:', error);
      res.status(500).json({
        success: false,
        message: '创建积分套餐失败'
      });
    }
  }

  // 管理员：更新积分套餐
  async updatePackage(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const creditPackage = await CreditPackage.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      );

      if (!creditPackage) {
        return res.status(404).json({
          success: false,
          message: '积分套餐不存在'
        });
      }

      res.json({
        success: true,
        message: '积分套餐更新成功',
        data: { package: creditPackage }
      });
    } catch (error) {
      console.error('更新积分套餐错误:', error);
      res.status(500).json({
        success: false,
        message: '更新积分套餐失败'
      });
    }
  }

  // 管理员：删除积分套餐
  async deletePackage(req, res) {
    try {
      const { id } = req.params;

      const creditPackage = await CreditPackage.findByIdAndDelete(id);
      if (!creditPackage) {
        return res.status(404).json({
          success: false,
          message: '积分套餐不存在'
        });
      }

      res.json({
        success: true,
        message: '积分套餐删除成功'
      });
    } catch (error) {
      console.error('删除积分套餐错误:', error);
      res.status(500).json({
        success: false,
        message: '删除积分套餐失败'
      });
    }
  }

  // 管理员：获取积分统计
  async getCreditsStats(req, res) {
    try {
      const totalRevenue = await CreditOrder.getTotalRevenue();
      const totalOrders = await CreditOrder.countDocuments({ payment_status: 'paid' });
      
      // 最近30天收入
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentRevenue = await CreditOrder.getTotalRevenue({
        payment_status: 'paid',
        paid_at: { $gte: thirtyDaysAgo }
      });

      res.json({
        success: true,
        data: {
          total_revenue: totalRevenue,
          total_orders: totalOrders,
          recent_revenue_30d: recentRevenue
        }
      });
    } catch (error) {
      console.error('获取积分统计错误:', error);
      res.status(500).json({
        success: false,
        message: '获取积分统计失败'
      });
    }
  }
}

module.exports = new CreditsController();