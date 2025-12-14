import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from './config.service';

export const getDatabaseConfig = async (
    configService: ConfigService,
): Promise<{
    main: TypeOrmModuleOptions;
    secondary: TypeOrmModuleOptions;
}> => {
    return {
        main: {
            type: 'mysql',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.getNumber('DB_PORT', 3306),
            username: configService.get('DB_USERNAME', 'root'),
            password: configService.get('DB_PASSWORD', ''),
            database: configService.get('DB_DATABASE', 'trello_lite'),
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: configService.getBoolean('DB_SYNC', false),
            logging: configService.getBoolean('DB_LOGGING', false),
        },
        secondary: {
            type: 'mysql',
            name: 'secondary',
            host: configService.get('DB_HOST_SECONDARY', 'localhost'),
            port: configService.getNumber('DB_PORT_SECONDARY', 3307),
            username: configService.get('DB_USERNAME_SECONDARY', 'root'),
            password: configService.get('DB_PASSWORD_SECONDARY', ''),
            database: configService.get('DB_DATABASE_SECONDARY', 'trello_lite_secondary'),
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: configService.getBoolean('DB_SYNC_SECONDARY', false),
            logging: configService.getBoolean('DB_LOGGING', false),
        },
    };
};

export const getTypeOrmConfig = (configService: ConfigService) => ({
    ...getDatabaseConfig(configService).then((config) => config.main),
    migrations: ['dist/migrations/*.js'],
    cli: {
        migrationsDir: 'src/migrations',
    },
});
