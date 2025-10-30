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
      credits_balance: parseInt(process.env.DEFAULT_CREDITS) || 100
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

    // 始终使用MongoDB数据库
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
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const adminUser = await AdminUser.findOne({ username });
    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const isValidPassword = await adminUser.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成管理员令牌
    const token = generateToken(adminUser._id, 'admin');

    res.json({
      success: true,
      message: '管理员登录成功',
      data: {
        user: {
          id: adminUser._id,
          username: adminUser.username,
          role: adminUser.role
        },
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
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 返回用户信息（不包含密码）
    const userResponse = user.toObject();
    delete userResponse.password_hash;

    res.json({
      success: true,
      data: {
        user: userResponse
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
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: '缺少刷新令牌'
      });
    }

    // 验证刷新令牌
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-here');
    
    // 检查用户是否存在
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 生成新的访问令牌
    const newToken = generateToken(user._id, 'user');

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: '无效的刷新令牌'
    });
  }
};

// 修改密码
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证当前密码
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: '当前密码错误'
      });
    }

    // 更新密码
    user.password_hash = newPassword;
    await user.save();

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败'
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
        message: '如果该邮箱存在，重置链接已发送'
      });
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // 设置令牌过期时间（1小时）
    const resetTokenExpires = Date.now() + 3600000;

    // 保存令牌到用户文档
    user.reset_password_token = resetTokenHash;
    user.reset_password_expires = resetTokenExpires;
    await user.save();

    // TODO: 发送重置邮件
    // 这里应该发送包含重置链接的邮件到用户邮箱
    // 重置链接格式: http://frontend-url/reset-password?token=resetToken

    res.json({
      success: true,
      message: '密码重置链接已发送到您的邮箱'
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({
      success: false,
      message: '请求密码重置失败'
    });
  }
};

// 确认密码重置
const confirmPasswordReset = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // 验证令牌
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      reset_password_token: resetTokenHash,
      reset_password_expires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: '重置令牌无效或已过期'
      });
    }

    // 更新密码
    user.password_hash = newPassword;
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;
    await user.save();

    res.json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('Confirm password reset error:', error);
    res.status(500).json({
      success: false,
      message: '密码重置失败'
    });
  }
};

// 邮箱验证
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // 验证令牌
    const verificationTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      verification_token: verificationTokenHash,
      email_verified: false
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: '验证令牌无效或已过期'
      });
    }

    // 更新用户邮箱验证状态
    user.email_verified = true;
    user.verification_token = undefined;
    await user.save();

    res.json({
      success: true,
      message: '邮箱验证成功'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: '邮箱验证失败'
    });
  }
};

// 重新发送验证邮件
const resendVerificationEmail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: '邮箱已验证'
      });
    }

    // 生成新的验证令牌
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    
    user.verification_token = verificationTokenHash;
    await user.save();

    // TODO: 发送验证邮件
    // 这里应该发送包含验证链接的邮件到用户邮箱
    // 验证链接格式: http://frontend-url/verify-email?token=verificationToken

    res.json({
      success: true,
      message: '验证邮件已重新发送'
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({
      success: false,
      message: '重新发送验证邮件失败'
    });
  }
};

// 登出
const logout = async (req, res) => {
  try {
    // 在JWT模式下，登出主要在前端清除令牌
    // 如果使用了刷新令牌存储，这里可以清除刷新令牌
    
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
  registerUser,
  loginUser,
  adminLogin,
  getCurrentUser,
  refreshToken,
  changePassword,
  requestPasswordReset,
  confirmPasswordReset,
  verifyEmail,
  resendVerificationEmail,
  logout
};