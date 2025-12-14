import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTasksTable1765705400000 implements MigrationInterface {
    name = 'CreateTasksTable1765705400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`tasks\` (
                \`id\` varchar(36) NOT NULL,
                \`title\` varchar(255) NOT NULL,
                \`description\` varchar(255) NULL,
                \`code\` varchar(255) NOT NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`due_date\` datetime NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`createdById\` varchar(36) NULL,
                \`updatedAt\` datetime(6) NULL,
                \`updatedById\` varchar(36) NULL,
                \`deletedAt\` datetime(6) NULL,
                \`deletedById\` varchar(36) NULL,
                \`statusId\` varchar(36) NULL,
                \`projectId\` varchar(36) NULL,
                \`assigneeId\` varchar(36) NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`uk_tasks_code\` (\`code\`),
                CONSTRAINT \`FK_tasks_status\` FOREIGN KEY (\`statusId\`) REFERENCES \`statuses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`FK_tasks_project\` FOREIGN KEY (\`projectId\`) REFERENCES \`projects\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`FK_tasks_assignee\` FOREIGN KEY (\`assigneeId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`FK_tasks_created_by\` FOREIGN KEY (\`createdById\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`FK_tasks_updated_by\` FOREIGN KEY (\`updatedById\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`FK_tasks_deleted_by\` FOREIGN KEY (\`deletedById\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE \`tasks\`
        `);
    }
}