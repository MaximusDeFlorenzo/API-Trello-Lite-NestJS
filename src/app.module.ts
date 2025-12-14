import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/user/users.module';
import { ConfigModule } from '@nestjs/config';
import { ProjectModule } from './modules/project/project.module';

@Module({
    imports: [
        ConfigModule,
        DatabaseModule,
        AuthModule,
        UsersModule,
        ProjectModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
