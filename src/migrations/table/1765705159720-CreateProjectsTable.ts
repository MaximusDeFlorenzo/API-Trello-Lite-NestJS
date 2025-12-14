import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProjectsTable1765705159720 implements MigrationInterface {
    name = 'CreateProjectsTable1765705159720';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`projects\` (
                \`id\` varchar(36) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`description\` varchar(255) NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`createdById\` varchar(36) NULL,
                \`updatedAt\` datetime(6) NULL,
                \`updatedById\` varchar(36) NULL,
                \`deletedAt\` datetime(6) NULL,
                \`is_migration\` tinyint NOT NULL DEFAULT 0,
                \`migrated_at\` datetime(6) NULL,
                \`deletedById\` varchar(36) NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`uk_projects_name\` (\`name\`),
                CONSTRAINT \`FK_projects_created_by\` FOREIGN KEY (\`createdById\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`FK_projects_updated_by\` FOREIGN KEY (\`updatedById\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`FK_projects_deleted_by\` FOREIGN KEY (\`deletedById\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE \`projects\`
        `);
    }
}
