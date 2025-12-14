import { ConfigService } from '../../config/config.service';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { DataSource } from 'typeorm';

const withMigrationMetadata = (data: any) => ({
    ...data,
    is_migration: 1,
    migrated_at: new Date().toISOString()
});

export class TransferDataFromSecondaryToPrimary1712345600000 implements MigrationInterface {
    name = 'TransferDataFromSecondaryToPrimary1712345600000';

    private async getSecondaryConnection() {
        const configService = new ConfigService();
        const secondaryDataSource = new DataSource({
            type: 'mysql',
            host: configService.get('DB_HOST_SECONDARY', 'localhost'),
            port: configService.getNumber('DB_PORT_SECONDARY', 3307),
            username: configService.get('DB_USERNAME_SECONDARY', 'root'),
            password: configService.get('DB_PASSWORD_SECONDARY', ''),
            database: configService.get('DB_DATABASE_SECONDARY', 'trelo_laravel'),
            synchronize: false,
            logging: process.env.NODE_ENV === 'development',
        });

        if (!secondaryDataSource.isInitialized) {
            await secondaryDataSource.initialize();
        }
        return secondaryDataSource;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const secondaryDataSource = await this.getSecondaryConnection();
        const secondaryConnection = secondaryDataSource.manager.connection;

        await queryRunner.startTransaction();

        try {
            console.log('Starting data transfer from secondary to primary database...');

            // 1. Transfer users
            console.log('Transferring users...');
            const users = await secondaryConnection.query('SELECT * FROM `users`');
            for (const user of users) {
                const userWithMetadata = withMigrationMetadata(user);
                await queryRunner.query(
                    `INSERT IGNORE INTO \`users\` (\`id\`, \`email\`, \`name\`, \`username\`, \`password\`, \`createdAt\`, \`updatedAt\`, \`deletedAt\`, \`is_active\`, \`is_migration\`, \`migrated_at\`) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userWithMetadata.id,
                        userWithMetadata.email,
                        userWithMetadata.name,
                        userWithMetadata.username,
                        userWithMetadata.password,
                        userWithMetadata.createdAt,
                        userWithMetadata.updatedAt,
                        userWithMetadata.deletedAt,
                        userWithMetadata.is_active,
                        userWithMetadata.is_migration,
                        userWithMetadata.migrated_at
                    ]
                );
            }

            // 2. Transfer projects
            const projects = await secondaryConnection.query('SELECT * FROM `projects`');
            for (const project of projects) {
                const projectWithMetadata = withMigrationMetadata(project);
                await queryRunner.query(
                    `INSERT IGNORE INTO \`projects\` (\`id\`, \`name\`, \`description\`, \`is_active\`, \`createdAt\`, \`createdById\`, \`updatedAt\`, \`updatedById\`, \`deletedAt\`, \`deletedById\`, \`is_migration\`, \`migrated_at\`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        project.id,
                        project.name,
                        project.description,
                        project.is_active,
                        project.createdAt,
                        project.createdById,
                        project.updatedAt,
                        project.updatedById,
                        project.deletedAt,
                        project.deletedById,
                        projectWithMetadata.is_migration,
                        projectWithMetadata.migrated_at
                    ]
                );
            }

            // 3. Transfer statuses
            const statuses = await secondaryConnection.query('SELECT * FROM `statuses`');
            for (const status of statuses) {
                const statusWithMetadata = withMigrationMetadata(status);
                await queryRunner.query(
                    `INSERT IGNORE INTO \`statuses\` (\`id\`, \`name\`, \`sequence\`, \`is_active\`, \`is_general\`, \`createdAt\`, \`createdById\`, \`updatedAt\`, \`updatedById\`, \`deletedAt\`, \`deletedById\`, \`projectId\`, \`is_migration\`, \`migrated_at\`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        status.id,
                        status.name,
                        status.sequence,
                        status.is_active,
                        status.is_general,
                        status.createdAt,
                        status.createdById,
                        status.updatedAt,
                        status.updatedById,
                        status.deletedAt,
                        status.deletedById,
                        status.projectId,
                        statusWithMetadata.is_migration,
                        statusWithMetadata.migrated_at
                    ]
                );
            }

            // 4. Transfer tasks
            const tasks = await secondaryConnection.query('SELECT * FROM `tasks`');
            for (const task of tasks) {
                const taskWithMetadata = withMigrationMetadata(task);
                await queryRunner.query(
                    `INSERT IGNORE INTO \`tasks\` (\`id\`, \`title\`, \`description\`, \`code\`, \`is_active\`, \`due_date\`, \`createdAt\`, \`createdById\`, \`updatedAt\`, \`updatedById\`, \`deletedAt\`, \`deletedById\`, \`statusId\`, \`projectId\`, \`assigneeId\`, \`is_migration\`, \`migrated_at\`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        task.id,
                        task.title,
                        task.description,
                        task.code,
                        task.is_active,
                        task.due_date,
                        task.createdAt,
                        task.createdById,
                        task.updatedAt,
                        task.updatedById,
                        task.deletedAt,
                        task.deletedById,
                        task.statusId,
                        task.projectId,
                        task.assigneeId,
                        taskWithMetadata.is_migration,
                        taskWithMetadata.migrated_at
                    ]
                );
            }

            // 5. Transfer members
            const members = await secondaryConnection.query('SELECT * FROM `members`');
            for (const member of members) {
                const memberWithMetadata = withMigrationMetadata(member);
                await queryRunner.query(
                    `INSERT IGNORE INTO \`members\` (
                        \`id\`, \`user\`, \`project\`, \`is_admin\`, \`is_active\`, 
                        \`createdAt\`, \`createdBy\`, \`updatedAt\`, \`updatedBy\`, 
                        \`deletedAt\`, \`deletedBy\`, \`is_migration\`, \`migrated_at\`
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        member.id,
                        member.user || member.userId,
                        member.project || member.projectId,
                        member.is_admin,
                        member.is_active,
                        member.createdAt,
                        member.createdBy || member.createdById,
                        member.updatedAt,
                        member.updatedBy || member.updatedById,
                        member.deletedAt,
                        member.deletedBy || member.deletedById,
                        memberWithMetadata.is_migration,
                        memberWithMetadata.migrated_at
                    ]
                );
            }

            await queryRunner.commitTransaction();
            console.log('Data transfer completed successfully!');
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Error during data transfer:', error);
            throw error;
        } finally {
            if (secondaryDataSource.isInitialized) {
                await secondaryDataSource.destroy();
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.startTransaction();
        try {
            // Delete all data that was migrated
            await queryRunner.query('DELETE FROM `members` WHERE `is_migration` = 1');
            await queryRunner.query('DELETE FROM `tasks` WHERE `is_migration` = 1');
            await queryRunner.query('DELETE FROM `statuses` WHERE `is_migration` = 1');
            await queryRunner.query('DELETE FROM `projects` WHERE `is_migration` = 1');
            await queryRunner.query('DELETE FROM `users` WHERE `is_migration` = 1');
            await queryRunner.commitTransaction();
            console.log('Rollback completed successfully!');
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Error during rollback:', error);
            throw error;
        }
    }
}