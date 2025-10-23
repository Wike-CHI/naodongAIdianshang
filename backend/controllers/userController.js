const { User, UserCredits, Subscription, GenerationRecord } = require('../models');

class UserController {
  // 获取用户列表（管理员）
  async getUsers(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        user_type, 
        status, 
        search 
      } = req.query;

      const filter = {};
      if (user_type) filter.user_type = user_type;
      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      const users = await User.find(filter)
        .select('-password_hash')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await User.countDocuments(filter);

      // 获取用户积分信息
      const usersWithCredits = await Promise.all(
        users.map(async (user) => {
          const credits = await UserCredits.findOne({ user_id: user._id });
          return {
            ...user.toObject(),
            credits: credits ? {
              current_credits: credits.current_credits,
              total_earned: credits.total_earned,
              total_consumed: credits.total_consumed
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: {
          users: usersWithCredits,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(total / limit),
            total_items: total,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('获取用户列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取用户列表失败'
      });
    }
  }

  // 获取用户详情（管理员）
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select('-password_hash');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 获取用户积分
      const credits = await UserCredits.findOne({ user_id: id });

      // 获取用户订阅
      const subscription = await Subscription.getUserActiveSubscription(id);

      // 获取用户统计信息
      const stats = await GenerationRecord.getStats({ user_id: id });

      res.json({
        success: true,
        data: {
          user: user.toObject(),
          credits: credits ? {
            current_credits: credits.current_credits,
            total_earned: credits.total_earned,
            total_consumed: credits.total_consumed
          } : null,
          subscription,
          stats
        }
      });
    } catch (error) {
      console.error('获取用户详情错误:', error);
      res.status(500).json({
        success: false,
        message: '获取用户详情失败'
      });
    }
  }

  // 更新用户信息（管理员）
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, email, phone, user_type, status } = req.body;

      const user = await User.findByIdAndUpdate(
        id,
        {
          username,
          email,
          phone,
          user_type,
          status,
          updated_at: new Date()
        },
        { new: true, runValidators: true }
      ).select('-password_hash');

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
      console.error('更新用户信息错误:', error);
      res.status(500).json({
        success: false,
        message: '更新用户信息失败'
      });
    }
  }

  // 更新用户资料（用户自己）
  async updateProfile(req, res) {
    try {
      const { username, phone } = req.body;
      const userId = req.user._id;

      // 检查用户名是否已被使用
      if (username) {
        const existingUser = await User.findOne({
          username,
          _id: { $ne: userId }
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: '用户名已被使用'
          });
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        {
          username,
          phone,
          updated_at: new Date()
        },
        { new: true, runValidators: true }
      ).select('-password_hash');

      res.json({
        success: true,
        message: '资料更新成功',
        data: { user }
      });
    } catch (error) {
      console.error('更新用户资料错误:', error);
      res.status(500).json({
        success: false,
        message: '更新资料失败'
      });
    }
  }

  // 删除用户（管理员）
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 删除相关数据
      await UserCredits.deleteMany({ user_id: id });
      await Subscription.deleteMany({ user_id: id });
      await GenerationRecord.deleteMany({ user_id: id });

      res.json({
        success: true,
        message: '用户删除成功'
      });
    } catch (error) {
      console.error('删除用户错误:', error);
      res.status(500).json({
        success: false,
        message: '删除用户失败'
      });
    }
  }

  // 获取用户统计信息（管理员）
  async getUserStats(req, res) {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ status: 'active' });
      const premiumUsers = await User.countDocuments({ user_type: 'premium' });
      const vipUsers = await User.countDocuments({ user_type: 'vip' });

      // 最近30天新增用户
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newUsers = await User.countDocuments({
        created_at: { $gte: thirtyDaysAgo }
      });

      res.json({
        success: true,
        data: {
          total_users: totalUsers,
          active_users: activeUsers,
          premium_users: premiumUsers,
          vip_users: vipUsers,
          new_users_30d: newUsers
        }
      });
    } catch (error) {
      console.error('获取用户统计错误:', error);
      res.status(500).json({
        success: false,
        message: '获取用户统计失败'
      });
    }
  }

  // 重置用户密码（管理员）
  async resetUserPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: '请提供新密码'
        });
      }

      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const user = await User.findByIdAndUpdate(
        id,
        { password_hash: hashedPassword },
        { new: true }
      ).select('-password_hash');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        message: '密码重置成功'
      });
    } catch (error) {
      console.error('重置密码错误:', error);
      res.status(500).json({
        success: false,
        message: '重置密码失败'
      });
    }
  }
}

module.exports = new UserController();