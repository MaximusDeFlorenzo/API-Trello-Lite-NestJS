import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class TokenBlacklistService {
    private redisClient: Redis;

    constructor(private configService: ConfigService) {
        this.redisClient = new Redis({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.getNumber('REDIS_PORT', 6379),
        });
    }

    async addToBlacklist(token: string, expiry: number): Promise<void> {
        const tokenWithoutBearer = token.replace('Bearer ', '');
        await this.redisClient.set(
            `blacklist:${tokenWithoutBearer}`,
            'blacklisted',
            'EX',
            expiry,
        );
    }

    async isTokenBlacklisted(token: string): Promise<boolean> {
        const tokenWithoutBearer = token.replace('Bearer ', '');
        const result = await this.redisClient.exists(`blacklist:${tokenWithoutBearer}`);
        return result === 1;
    }
}
