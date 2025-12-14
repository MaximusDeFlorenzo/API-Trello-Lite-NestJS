import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { getDatabaseConfig } from '../config/database.config';

@Global()
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => {
                const { main } = await getDatabaseConfig(config);
                return main;
            },
        }),
        TypeOrmModule.forRootAsync({
            name: 'secondary',
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => {
                const { secondary } = await getDatabaseConfig(config);
                return secondary;
            },
        }),
    ],
    exports: [TypeOrmModule],
})
export class DatabaseModule { }
