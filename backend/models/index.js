// 统一导出所有模型
const User = require('./User');
const UserCredits = require('./UserCredits');
const AiTool = require('./AiTool');
const ToolConfig = require('./ToolConfig');
const GenerationRecord = require('./GenerationRecord');
const SubscriptionPlan = require('./SubscriptionPlan');
const Subscription = require('./Subscription');
const CreditPackage = require('./CreditPackage');
const CreditOrder = require('./CreditOrder');
const AdminUser = require('./AdminUser');

module.exports = {
  User,
  UserCredits,
  AiTool,
  ToolConfig,
  GenerationRecord,
  SubscriptionPlan,
  Subscription,
  CreditPackage,
  CreditOrder,
  AdminUser
};