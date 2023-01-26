import { Redis } from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

export const maxWrongAttemptsByIPperDay = 100;
export const maxConsecutiveFailsByEmailAndIP = 10;

export const redis = new Redis();
export const rateLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'middleware',
    points: 10, // 10 requests
    duration: 1 // per 1 second by IP
});
export const limiterSlowBruteByIP = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'login_fail_ip_per_day',
    points: maxWrongAttemptsByIPperDay,
    duration: 60 * 60 * 24,
    blockDuration: 60 * 60 * 24 // Block for 1 day, if 100 wrong attempts per day
});

export const limiterConsecutiveFailsByEmailAndIP = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'login_fail_consecutive_Email_and_ip',
    points: maxConsecutiveFailsByEmailAndIP,
    duration: 60 * 60 * 24 * 90, // Store number for 90 days since first fail
    blockDuration: 60 * 60 // Block for 1 hour
});
