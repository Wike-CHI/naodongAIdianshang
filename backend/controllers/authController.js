const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const logger = require('../utils/logger');
const AdminUser = require('../models/AdminUser');

// 生成JWT令牌
const generateToken = (userId, type = 'user', expiresIn = '7d') => {
  return jwt.sign(
    { userId, type },
    process.env.JWT_SECRET || 'your-secret-key-here',
    { expiresIn }
  );
};

// 用户注册
const registerUser = async (req, res) => {
  try {
    const { email, username, password, phone } = req.body;

    // 检查邮箱是否已存在（仅当提供了邮箱时）
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已被注册'
        });
      }
    }

    // 检查手机号是否已存在（仅当提供了手机号时）
    if (phone) {
      const existingPhoneUser = await User.findOne({ phone });
      if (existingPhoneUser) {
        return res.status(400).json({
          success: false,
          message: '该手机号已被注册'
        });
      }
    }

    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: '该用户名已被使用'
      });
    }

    // 创建新用户
    const user = new User({
      email,
      phone,
      username,
      password_hash: password, // 将在pre-save中间件中加密
      credit_balance: parseInt(process.env.DEFAULT_CREDITS) || 100
    });

    await user.save();

    // 生成令牌
    const token = generateToken(user._id, 'user');

    // 返回用户信息（不包含密码）
    const userResponse = user.toObject();
    delete userResponse.password_hash;

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
};

// 用户登录
const loginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // 检查是否使用内存数据库
    const useMemoryDB = process.env.USE_MEMORY_DB === 'true';
    
    if (useMemoryDB) {
      // 使用内存数据库
      const memoryUsers = global.memoryUsers || [
        {
          id: 1,
          phone: '13800138000',
          password: '123456', // 简化密码验证
          username: 'testuser',
          email: 'test@example.com',
          credits: 100,
          createdAt: new Date()
        }
      ];
      
      let user;
      if (phone) {
        user = memoryUsers.find(u => u.phone === phone);
      } else if (email) {
        user = memoryUsers.find(u => u.email === email);
      } else {
        return res.status(400).json({
          success: false,
          message: '请提供邮箱或手机号'
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: phone ? '手机号或密码错误' : '邮箱或密码错误'
        });
      }

      // 简化密码验证
      if (user.password !== password) {
        return res.status(401).json({
          success: false,
          message: phone ? '手机号或密码错误' : '邮箱或密码错误'
        });
      }

      // 生成令牌
      const token = generateToken(user.id, 'user');

      // 返回用户信息（不包含密码）
      const userResponse = { ...user };
      delete userResponse.password;

      return res.json({
        success: true,
        message: '登录成功',
        data: {
          user: userResponse,
          token
        }
      });
    }

    // 原有的MongoDB逻辑
    let user;
    if (phone) {
      user = await User.findOne({ phone });
    } else if (email) {
      user = await User.findOne({ email });
    } else {
      return res.status(400).json({
        success: false,
        message: '请提供邮箱或手机号'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: phone ? '手机号或密码错误' : '邮箱或密码错误'
      });
    }

    // 检查账户状态
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用，请联系管理员'
      });
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: phone ? '手机号或密码错误' : '邮箱或密码错误'
      });
    }

    // 更新最后登录时间
    await user.updateLastLogin();

    // 生成令牌
    const token = generateToken(user._id, 'user');

    // 返回用户信息（不包含密码）
    const userResponse = user.toObject();
    delete userResponse.password_hash;

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
};

// 管理员登录
const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找管理员
    const admin = await AdminUser.findOne({ username });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 检查账户锁定状态
    if (admin.isLocked()) {
      const lockTimeRemaining = Math.ceil((admin.locked_until - new Date()) / 1000 / 60);
      return res.status(423).json({
        success: false,
        message: `账户已被锁定，请在 ${lockTimeRemaining} 分钟后重试`
      });
    }

    // 检查账户状态
    if (!admin.is_active) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用，请联系超级管理员'
      });
    }

    // 验证密码
    const isValidPassword = await admin.validatePassword(password);
    if (!isValidPassword) {
      // 增加登录失败次数
      await admin.incrementLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 重置登录失败次数
    admin.login_attempts = 0;
    admin.locked_until = null;
    await admin.save();

    // 更新最后登录时间
    await admin.updateLastLogin();

    // 生成令牌
    const token = generateToken(admin._id, 'admin');

    // 返回管理员信息（不包含密码）
    const adminResponse = admin.toObject();
    delete adminResponse.password_hash;

    res.json({
      success: true,
      message: '登录成功',
      data: {
        admin: adminResponse,
        token
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
  try {
    let user;
    
    if (req.userType === 'admin') {
      user = await AdminUser.findById(req.user._id).select('-password_hash');
    } else {
      user = await User.findById(req.user._id).select('-password_hash');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        user,
        user_type: req.userType
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

// 刷新令牌
const refreshToken = async (req, res) => {
  try {
    const { user } = req;
    
    // 生成新令牌
    const token = generateToken(user._id, req.userType);

    res.json({
      success: true,
      message: '令牌刷新成功',
      data: {
        token
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: '令牌刷新失败'
    });
  }
};

// 修改密码
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const { user, userType } = req;

    // 验证当前密码
    const isValidPassword = await user.validatePassword(current_password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: '当前密码错误'
      });
    }

    // 更新密码
    user.password_hash = new_password; // 将在pre-save中间件中加密
    await user.save();

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '密码修改失败'
    });
  }
};

// 请求密码重置
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // 为了安全，即使用户不存在也返回成功消息
      return res.json({
        success: true,
        message: '如果该邮箱已注册，您将收到密码重置邮件'
      });
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1小时后过期

    user.reset_password_token = resetToken;
    user.reset_password_expires = resetTokenExpiry;
    await user.save();

    // TODO: 发送重置邮件
    // 这里应该集成邮件服务发送重置链接
    logger.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: '如果该邮箱已注册，您将收到密码重置邮件'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: '密码重置请求失败'
    });
  }
};

// 确认密码重置
const confirmPasswordReset = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      reset_password_token: token,
      reset_password_expires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: '重置令牌无效或已过期'
      });
    }

    // 更新密码
    user.password_hash = password; // 将在pre-save中间件中加密
    user.reset_password_token = null;
    user.reset_password_expires = null;
    await user.save();

    res.json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    res.status(500).json({
      success: false,
      message: '密码重置失败'
    });
  }
};

// 邮箱验证
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ email_verification_token: token });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: '验证令牌无效'
      });
    }

    user.is_email_verified = true;
    user.email_verification_token = null;
    await user.save();

    res.json({
      success: true,
      message: '邮箱验证成功'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: '邮箱验证失败'
    });
  }
};

// 重新发送验证邮件
const resendVerificationEmail = async (req, res) => {
  try {
    const { user } = req;

    if (user.is_email_verified) {
      return res.status(400).json({
        success: false,
        message: '邮箱已经验证过了'
      });
    }

    // 生成新的验证令牌
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.email_verification_token = verificationToken;
    await user.save();

    // TODO: 发送验证邮件
    logger.log(`Email verification token for ${user.email}: ${verificationToken}`);

    res.json({
      success: true,
      message: '验证邮件已发送'
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({
      success: false,
      message: '发送验证邮件失败'
    });
  }
};

// 登出（客户端处理，服务端记录）
const logout = async (req, res) => {
  try {
    // 这里可以添加令牌黑名单逻辑
    // 或者记录登出日志
    
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: '登出失败'
    });
  }
};

module.exports = {
  register: registerUser,
  login: loginUser,
  adminLogin: loginAdmin,
  getCurrentUser,
  refreshToken,
  changePassword,
  requestPasswordReset,
  confirmPasswordReset,
  verifyEmail,
  resendVerificationEmail,
  logout
};