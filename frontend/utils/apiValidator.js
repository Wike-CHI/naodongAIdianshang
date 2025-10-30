// API响应数据验证工具

/**
 * 验证用户对象数据结构
 * @param {Object} user - 用户对象
 * @returns {Object} 验证后的用户对象
 */
export const validateUserObject = (user) => {
  if (!user || typeof user !== 'object') {
    throw new Error('Invalid user object');
  }

  // 确保必需字段存在
  const validatedUser = {
    id: user.id || user._id,
    username: user.username || '',
    email: user.email || null,
    phone: user.phone || null,
    credits: user.credits_balance !== undefined ? user.credits_balance : (user.credits || 0),
    credits_balance: user.credits_balance !== undefined ? user.credits_balance : (user.credits || 0),
    membershipType: user.membershipType || user.role || 'normal',
    is_active: user.is_active !== undefined ? user.is_active : true,
    created_at: user.created_at || null,
    avatar_url: user.avatar_url || null
  };

  return validatedUser;
};

/**
 * 验证订阅对象数据结构
 * @param {Object} subscription - 订阅对象
 * @returns {Object} 验证后的订阅对象
 */
export const validateSubscriptionObject = (subscription) => {
  if (!subscription || typeof subscription !== 'object') {
    throw new Error('Invalid subscription object');
  }

  const validatedSubscription = {
    id: subscription.id || subscription._id,
    user_id: subscription.user_id,
    plan_id: subscription.plan_id,
    start_date: subscription.start_date,
    end_date: subscription.end_date,
    status: subscription.status || 'active',
    amount_paid: subscription.amount_paid || 0,
    payment_method: subscription.payment_method || '',
    transaction_id: subscription.transaction_id || '',
    credits_granted: subscription.credits_granted || 0,
    credits_used: subscription.credits_used || 0,
    is_yearly_member: subscription.is_yearly_member || false
  };

  return validatedSubscription;
};

/**
 * 验证订阅套餐对象数据结构
 * @param {Object} plan - 订阅套餐对象
 * @returns {Object} 验证后的订阅套餐对象
 */
export const validateSubscriptionPlanObject = (plan) => {
  if (!plan || typeof plan !== 'object') {
    throw new Error('Invalid subscription plan object');
  }

  const validatedPlan = {
    id: plan.id || plan._id,
    name: plan.name || '',
    description: plan.description || '',
    price: plan.price || 0,
    duration_months: plan.duration_months || 1,
    benefits: plan.benefits || {},
    active: plan.active !== undefined ? plan.active : true,
    is_yearly: plan.is_yearly || false,
    yearly_price: plan.yearly_price || null
  };

  // 确保benefits对象中的必需字段存在
  validatedPlan.benefits = {
    monthly_credits: plan.benefits?.monthly_credits || 0,
    priority_processing: plan.benefits?.priority_processing || false,
    advanced_features: plan.benefits?.advanced_features || false,
    support_level: plan.benefits?.support_level || 'basic',
    ...plan.benefits
  };

  return validatedPlan;
};

/**
 * 验证积分记录对象数据结构
 * @param {Object} record - 积分记录对象
 * @returns {Object} 验证后的积分记录对象
 */
export const validateCreditRecordObject = (record) => {
  if (!record || typeof record !== 'object') {
    throw new Error('Invalid credit record object');
  }

  const validatedRecord = {
    id: record.id || record._id,
    user_id: record.user_id,
    type: record.type || 'consumption',
    amount: record.amount || 0,
    balance_before: record.balance_before || 0,
    balance_after: record.balance_after || 0,
    description: record.description || '',
    created_at: record.created_at || new Date().toISOString()
  };

  return validatedRecord;
};

/**
 * 验证API响应数据结构
 * @param {Object} response - API响应对象
 * @param {string} expectedType - 期望的数据类型 ('user' | 'subscription' | 'plan' | 'creditRecord')
 * @returns {Object} 验证后的数据对象
 */
export const validateApiResponse = (response, expectedType) => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid API response');
  }

  if (response.success === false) {
    throw new Error(response.message || 'API request failed');
  }

  const payload = response.data !== undefined ? response.data : response;

  if (!payload || typeof payload !== 'object') {
    throw new Error('Missing data in API response');
  }

  switch (expectedType) {
    case 'user':
      return validateUserObject(payload.user || payload);
    case 'subscription':
      return validateSubscriptionObject(payload.subscription || payload);
    case 'plan':
      return validateSubscriptionPlanObject(payload.plan || payload);
    case 'creditRecord':
      return validateCreditRecordObject(payload.record || payload);
    default:
      return payload;
  }
};

export default {
  validateUserObject,
  validateSubscriptionObject,
  validateSubscriptionPlanObject,
  validateCreditRecordObject,
  validateApiResponse
};