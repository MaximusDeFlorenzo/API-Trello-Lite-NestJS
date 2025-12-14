import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStatusesTable1765705200000 implements MigrationInterface {
    name = 'CreateStatusesTable1765705200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`statuses\` (
                \`id\` varchar(36) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`sequence\` int NOT NULL DEFAULT 0,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`is_general\` tinyint NOT NULL DEFAULT 0,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`createdBy\` varchar(36) NULL,
                \`updatedAt\` datetime(6) NULL,
                \`updatedBy\` varchar(36) NULL,
                \`deletedAt\` datetime(6) NULL,
                \`deletedBy\` varchar(36) NULL,
                \`project\` varchar(36) NULL,
                \`is_migration\` tinyint NOT NULL DEFAULT 0,
                \`migrated_at\` datetime(6) NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`uk_statuses_name\` (\`name\`),
                CONSTRAINT \`FK_statuses_created_by\` FOREIGN KEY (\`createdBy\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`FK_statuses_updated_by\` FOREIGN KEY (\`updatedBy\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`FK_statuses_deleted_by\` FOREIGN KEY (\`deletedBy\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`FK_statuses_project\` FOREIGN KEY (\`project\`) REFERENCES \`projects\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE \`statuses\`
        `);
    }
}