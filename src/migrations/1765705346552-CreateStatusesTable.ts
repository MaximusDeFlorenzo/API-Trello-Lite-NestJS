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
                \`createdById\` varchar(36) NULL,
                \`updatedAt\` datetime(6) NULL,
                \`updatedById\` varchar(36) NULL,
                \`deletedAt\` datetime(6) NULL,
                \`deletedById\` varchar(36) NULL,
                \`projectId\` varchar(36) NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`uk_statuses_name\` (\`name\`),
                CONSTRAINT \`FK_statuses_created_by\` FOREIGN KEY (\`createdById\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`FK_statuses_updated_by\` FOREIGN KEY (\`updatedById\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`FK_statuses_deleted_by\` FOREIGN KEY (\`deletedById\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`FK_statuses_project\` FOREIGN KEY (\`projectId\`) REFERENCES \`projects\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE \`statuses\`
        `);
    }
}