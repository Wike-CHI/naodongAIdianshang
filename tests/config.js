// Test configuration
module.exports = {
  // Frontend URLs
  frontend: {
    baseUrl: 'http://localhost:5173',
    pages: {
      home: '/',
      login: '/login',
      register: '/register',
      dashboard: '/dashboard',
      aiTools: '/ai-tools',
      history: '/history',
      profile: '/profile'
    }
  },
  
  // Admin panel URLs
  admin: {
    baseUrl: 'http://localhost:5175',
    pages: {
      login: '/admin/login',
      dashboard: '/admin/dashboard',
      users: '/admin/users',
      aiTools: '/admin/ai-tools',
      subscriptions: '/admin/subscriptions',
      credits: '/admin/credits'
    }
  },
  
  // Backend API
  backend: {
    baseUrl: 'http://localhost:8080',
    api: {
      auth: '/api/auth',
      admin: '/api/admin',
      ai: '/api/ai',
      users: '/api/admin/users',
      tools: '/api/admin/ai-tools'
    }
  },
  
  // Test users
  users: {
    admin: {
      username: 'admin',
      password: 'admin123'
    },
    regular: {
      username: 'testuser',
      password: '123456'
    }
  },
  
  // Browser settings
  browser: {
    headless: false, // Set to true for CI/CD
    slowMo: 10, // Slow down operations for better observation
    timeout: 30000 // Default timeout for operations
  },
  
  // Test settings
  test: {
    screenshotDir: './screenshots',
    reportDir: './reports'
  }
};