import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMembersTable1765705500000 implements MigrationInterface {
    name = 'CreateMembersTable1765705500000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`members\` (
                \`id\` varchar(36) NOT NULL,
                \`is_admin\` tinyint NOT NULL DEFAULT 0,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NULL,
                \`deletedAt\` datetime(6) NULL,
                \`userId\` varchar(36) NOT NULL,
                \`projectId\` varchar(36) NOT NULL,
                \`createdById\` varchar(36) NOT NULL,
                \`updatedById\` varchar(36) NULL,
                \`deletedById\` varchar(36) NULL,
                \`is_migration\` tinyint NOT NULL DEFAULT 0,
                \`migrated_at\` datetime(6) NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`uk_members_user_project\` (\`userId\`, \`projectId\`),
                CONSTRAINT \`FK_members_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT \`FK_members_project\` FOREIGN KEY (\`projectId\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT \`FK_members_created_by\` FOREIGN KEY (\`createdById\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`FK_members_updated_by\` FOREIGN KEY (\`updatedById\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`FK_members_deleted_by\` FOREIGN KEY (\`deletedById\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE \`members\`
        `);
    }
}