const bcrypt = require('bcryptjs');
const { User, AdminUser, UserCredits } = require('../models');
const jwtService = require('../utils/jwt');

class AuthController {
  // 用户注册
  async register(req, res) {
    try {
      const { username, email, password, phone } = req.body;

      // 验证必填字段
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: '用户名、邮箱和密码为必填项'
        });
      }

      // 检查用户是否已存在
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名或邮箱已存在'
        });
      }

      // 创建新用户
      const user = new User({
        username,
        email,
        password_hash: await bcrypt.hash(password, 10),
        phone,
        user_type: 'free',
        status: 'active'
      });

      await user.save();

      // 初始化用户积分
      const userCredits = new UserCredits({
        user_id: user._id,
        current_credits: 100, // 新用户赠送100积分
        total_earned: 100,
        total_consumed: 0
      });
      await userCredits.save();

      // 生成token
      const token = jwtService.generateUserToken(user);

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            user_type: user.user_type,
            status: user.status
          },
          token
        }
      });
    } catch (error) {
      console.error('注册错误:', error);
      res.status(500).json({
        success: false,
        message: '注册失败，请稍后重试'
      });
    }
  }

  // 用户登录
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: '邮箱和密码为必填项'
        });
      }

      // 查找用户
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '邮箱或密码错误'
        });
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: '邮箱或密码错误'
        });
      }

      // 检查用户状态
      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: '账户已被禁用'
        });
      }

      // 更新最后登录时间
      user.last_login_at = new Date();
      await user.save();

      // 生成token
      const token = jwtService.generateUserToken(user);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            user_type: user.user_type,
            status: user.status
          },
          token
        }
      });
    } catch (error) {
      console.error('登录错误:', error);
      res.status(500).json({
        success: false,
        message: '登录失败，请稍后重试'
      });
    }
  }

  // 管理员登录
  async adminLogin(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: '用户名和密码为必填项'
        });
      }

      // 查找管理员
      const admin = await AdminUser.findOne({ username });
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      // 验证密码
      const isValidPassword = await admin.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      // 检查管理员状态
      if (!admin.is_active) {
        return res.status(401).json({
          success: false,
          message: '账户已被禁用'
        });
      }

      // 更新最后登录时间
      await admin.updateLastLogin();

      // 生成token
      const token = jwtService.generateAdminToken(admin);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          admin: {
            id: admin._id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions
          },
          token
        }
      });
    } catch (error) {
      console.error('管理员登录错误:', error);
      res.status(500).json({
        success: false,
        message: '登录失败，请稍后重试'
      });
    }
  }

  // 获取当前用户信息
  async getCurrentUser(req, res) {
    try {
      const user = req.user;
      
      // 获取用户积分信息
      const credits = await UserCredits.findOne({ user_id: user._id });

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            user_type: user.user_type,
            status: user.status,
            created_at: user.created_at,
            last_login_at: user.last_login_at
          },
          credits: credits ? {
            current_credits: credits.current_credits,
            total_earned: credits.total_earned,
            total_consumed: credits.total_consumed
          } : null
        }
      });
    } catch (error) {
      console.error('获取用户信息错误:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败'
      });
    }
  }

  // 获取当前管理员信息
  async getCurrentAdmin(req, res) {
    try {
      const admin = req.admin;

      res.json({
        success: true,
        data: {
          admin: {
            id: admin._id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions,
            created_at: admin.created_at,
            last_login_at: admin.last_login_at
          }
        }
      });
    } catch (error) {
      console.error('获取管理员信息错误:', error);
      res.status(500).json({
        success: false,
        message: '获取管理员信息失败'
      });
    }
  }

  // 修改密码
  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = req.user;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '旧密码和新密码为必填项'
        });
      }

      // 验证旧密码
      const isValidPassword = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: '旧密码错误'
        });
      }

      // 更新密码
      user.password_hash = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.json({
        success: true,
        message: '密码修改成功'
      });
    } catch (error) {
      console.error('修改密码错误:', error);
      res.status(500).json({
        success: false,
        message: '修改密码失败'
      });
    }
  }

  // 登出（客户端处理，服务端记录日志）
  async logout(req, res) {
    try {
      // 这里可以添加登出日志记录
      res.json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      console.error('登出错误:', error);
      res.status(500).json({
        success: false,
        message: '登出失败'
      });
    }
  }
}

module.exports = new AuthController();