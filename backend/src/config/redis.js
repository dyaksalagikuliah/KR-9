const Redis = require('ioredis');
require('dotenv').config();

// Redis client configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

// Create Redis client
const redis = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

// Cache helper functions
const cache = {
  // Get cached data
  get: async (key) => {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  },

  // Set cache with expiration (in seconds)
  set: async (key, value, ttl = 300) => {
    try {
      const data = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, data);
      } else {
        await redis.set(key, data);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  },

  // Delete cache
  del: async (key) => {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  },

  // Delete multiple keys by pattern
  deletePattern: async (pattern) => {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Redis DELETE PATTERN error:', error);
      return 0;
    }
  },

  // Increment counter
  incr: async (key) => {
    try {
      return await redis.incr(key);
    } catch (error) {
      console.error('Redis INCR error:', error);
      return null;
    }
  },

  // Set with NX (only if not exists)
  setnx: async (key, value, ttl = 300) => {
    try {
      const data = JSON.stringify(value);
      const result = await redis.set(key, data, 'EX', ttl, 'NX');
      return result === 'OK';
    } catch (error) {
      console.error('Redis SETNX error:', error);
      return false;
    }
  },
};

module.exports = {
  redis,
  cache,
};
