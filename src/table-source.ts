import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from './config/config.service';

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
    type: 'mysql',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.getNumber('DB_PORT', 3306),
    username: configService.get('DB_USERNAME', 'root'),
    password: configService.get('DB_PASSWORD', ''),
    database: configService.get('DB_DATABASE', 'trelo_nestjs'),
    migrations: ['src/migrations/table/*.ts'],
    synchronize: false,
    logging: true,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
