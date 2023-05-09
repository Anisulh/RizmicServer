import { Redis } from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import config from '../config/config';

export const redis = new Redis({showFriendlyErrorStack:true});

export const rateLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'middleware',
    points: 10, // 10 requests
    duration: 1 // per 1 second by IP
});

export const limiterSlowBruteByIP = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'login_fail_ip_per_day',
    points: config.maxWrongAttemptsByIPperDay as number,
    duration: 60 * 60 * 24,
    blockDuration: 60 * 60 * 24 // Block for 1 day, if 100 wrong attempts per day
});
 
export const limiterConsecutiveFailsByEmailAndIP = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'login_fail_consecutive_Email_and_ip',
    points: config.maxConsecutiveFailsByEmailAndIP as number,
    duration: 60 * 60 * 24 * 90, // Store number for 90 days since first fail
    blockDuration: 60 * 60 // Block for 1 hour
});
