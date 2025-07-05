import { HttpException, HttpStatus, Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { ThrottlerStorageService } from "@nestjs/throttler";
import { UserRole } from "src/modules/user/enums";
import { RateLimitConfig } from "../interfaces";
import { NextFunction, Request, Response } from "express";




@Injectable()
export class AuthRateLimitMiddleware implements NestMiddleware {
    private readonly logger = new Logger(AuthRateLimitMiddleware.name);
    constructor(
        private readonly storageService: ThrottlerStorageService
    ) { }

    private readonly authEndpointRateLimits: Record<string, Record<UserRole, RateLimitConfig>> = {
        'POST:/api/auth/register': {
            [UserRole.Admin]: { ttl: 300000, limit: 50 },
            [UserRole.User]: { ttl: 3600000, limit: 5 }
        },
        'POST:/api/auth/login': {
            [UserRole.Admin]: { ttl: 300000, limit: 100 },
            [UserRole.User]: { ttl: 300000, limit: 20 },
        },
        'POST:/api/auth/refresh': {
            [UserRole.Admin]: { ttl: 300000, limit: 200 },
            [UserRole.User]: { ttl: 300000, limit: 60 },
        },
        'POST:/api/auth/logout': {
            [UserRole.Admin]: { ttl: 60000, limit: 50 },
            [UserRole.User]: { ttl: 60000, limit: 20 },
        },
        'GET:/api/auth/profile': {
            [UserRole.Admin]: { ttl: 60000, limit: 200 },
            [UserRole.User]: { ttl: 60000, limit: 60 },
        }
    };

    async use(req: Request, res: Response, next: NextFunction) {
        try {
            const userRoleRequest = (req as any).user.role;
            this.logger.log("user role request", userRoleRequest);

            const endpointKey = this.getEndpointKey(req);
            const rateLimitConfig = this.getRateLimitConfig(endpointKey, userRoleRequest);

            if (!rateLimitConfig) {
                return next();
            }

            const trackingKey = this.getTrackingKey(req, userRoleRequest, endpointKey);

            const { totalHits, timeToExpire } = await this.storageService.increment(
                trackingKey,
                rateLimitConfig.ttl,
                rateLimitConfig.limit,
                rateLimitConfig.ttl,
                `${userRoleRequest}-${endpointKey}`
            );

            const remaining = Math.max(0, rateLimitConfig.limit - totalHits);
            const resetTime = new Date(Date.now() + timeToExpire);

            res.set({
                'X-RateLimit-Limit': rateLimitConfig.limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': resetTime.toISOString(),
                'X-RateLimit-Window': (rateLimitConfig.ttl / 1000).toString(),
                'X-RateLimit-Role': userRoleRequest,
                'X-RateLimit-Endpoint': endpointKey
            });

            if (totalHits > rateLimitConfig.limit) {
                this.logger.warn('Rate limit exceeded', {
                    endpoint: endpointKey,
                    userRoleRequest,
                    userId: (req as any).userId || req.ip,
                    userAgent: req.get('User-Agent'),
                    totalHits,
                    limit: rateLimitConfig.limit,
                    timeToExpire: Math.ceil(timeToExpire / 1000)
                });

                throw new HttpException(
                    {
                        message: `Rate limit exceeded for ${userRoleRequest} role on ${endpointKey}`,
                        statusCode: HttpStatus.TOO_MANY_REQUESTS,
                        error: 'Too Many Requests',
                        details: {
                            role: userRoleRequest,
                            endpoint: endpointKey,
                            limit: rateLimitConfig.limit,
                            windowSeconds: rateLimitConfig.ttl / 1000,
                            retryAfter: Math.ceil(timeToExpire / 1000),
                            resetAt: resetTime.toISOString()
                        }
                    },
                    HttpStatus.TOO_MANY_REQUESTS
                );
            }

            next();

        } catch (error) {
            if (error instanceof HttpException) {
                next(error);
            } else {
                this.logger.error('Rate limit middleware error', error);
                next(error);
            }
        }

    }

    private getEndpointKey(req: Request): string {
        const method = req.method;
        const path = req.route?.path || req.path;

        const normalizedPath = path.replace(/\/+$/, '');
        return `${method}:${normalizedPath}`;
    }

    private getRateLimitConfig(endpointKey: string, userRole: UserRole): RateLimitConfig | null {
        const endpointConfig = this.authEndpointRateLimits[endpointKey];
        return endpointConfig ? endpointConfig[userRole] : null;
    }

    private getTrackingKey(req: Request, userRole: UserRole, endpointKey: string): string {
        const identifier = (req as any).userId || req.ip;
        const timestamp = Math.floor(Date.now() / 60000);

        return `auth_rate_limit:${identifier}:${userRole}:${endpointKey}:${timestamp}`;
    }

}