const CreditPackage = require('../models/CreditPackage');
const User = require('../models/User');
const CreditRecord = require('../models/CreditRecord');
const Subscription = require('../models/Subscription');

// 获取积分套餐列表（仅限年度会员）
const getCreditPackages = async (req, res) => {
  try {
    // 检查用户是否为年度会员
    const userId = req.userType === 'admin' ? req.user.id : req.user._id;
    const currentSubscription = await Subscription.getCurrentSubscription(userId);
    
    // 如果用户不是年度会员，返回空列表
    if (!currentSubscription || !currentSubscription.is_yearly_member) {
      return res.json({
        success: true,
        data: { packages: [] }
      });
    }

    const packages = await CreditPackage.find({ active: true }).sort({ sort_order: 1, price: 1 });

    res.json({
      success: true,
      data: { packages }
    });
  } catch (error) {
    console.error('Get credit packages error:', error);
    res.status(500).json({
      success: false,
      message: '获取积分套餐失败'
    });
  }
};

// 管理员创建积分套餐
const createCreditPackage = async (req, res) => {
  try {
    const packageData = req.body;
    
    const creditPackage = new CreditPackage(packageData);
    await creditPackage.save();

    res.status(201).json({
      success: true,
      message: '积分套餐创建成功',
      data: { package: creditPackage }
    });
  } catch (error) {
    console.error('Create credit package error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      success: false,
      message: '创建积分套餐失败'
    });
  }
};

// 管理员更新积分套餐
const updateCreditPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const creditPackage = await CreditPackage.findByIdAndUpdate(
      id,
      { $set: updateData },
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
    console.error('Update credit package error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      success: false,
      message: '更新积分套餐失败'
    });
  }
};

// 管理员删除积分套餐
const deleteCreditPackage = async (req, res) => {
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
    console.error('Delete credit package error:', error);
    res.status(500).json({
      success: false,
      message: '删除积分套餐失败'
    });
  }
};

// 购买积分套餐
const purchaseCreditPackage = async (req, res) => {
  try {
    const { package_id, payment_method, transaction_id } = req.body;
    const userId = req.userType === 'admin' ? req.user.id : req.user._id;

    // 检查用户是否为年度会员
    const currentSubscription = await Subscription.getCurrentSubscription(userId);
    if (!currentSubscription || !currentSubscription.is_yearly_member) {
      return res.status(403).json({
        success: false,
        message: '只有年度会员才能购买积分套餐'
      });
    }

    // 获取积分套餐信息
    const creditPackage = await CreditPackage.findById(package_id);
    if (!creditPackage || !creditPackage.active) {
      return res.status(404).json({
        success: false,
        message: '积分套餐不存在或已停用'
      });
    }

    // 获取用户信息
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 记录购买前的积分余额
    const balanceBefore = user.credits_balance;

    // 给用户添加积分（包含奖励积分）
    const totalCredits = creditPackage.credits + creditPackage.bonus_credits;
    user.credits_balance += totalCredits;
    await user.save();

    // 记录积分变动
    const creditRecord = await CreditRecord.create({
      user_id: userId,
      type: 'recharge',
      amount: totalCredits,
      balance_before: balanceBefore,
      balance_after: user.credits_balance,
      description: `购买积分套餐: ${creditPackage.name}`,
      metadata: {
        credit_package_id: creditPackage._id,
        package_name: creditPackage.name,
        base_credits: creditPackage.credits,
        bonus_credits: creditPackage.bonus_credits,
        payment_method,
        transaction_id
      }
    });

    res.status(201).json({
      success: true,
      message: '积分购买成功',
      data: {
        user: {
          id: user._id,
          credits_balance: user.credits_balance
        },
        creditRecord,
        purchased_credits: totalCredits
      }
    });
  } catch (error) {
    console.error('Purchase credit package error:', error);
    res.status(500).json({
      success: false,
      message: '购买积分套餐失败'
    });
  }
};

module.exports = {
  getCreditPackages,
  createCreditPackage,
  updateCreditPackage,
  deleteCreditPackage,
  purchaseCreditPackage
};