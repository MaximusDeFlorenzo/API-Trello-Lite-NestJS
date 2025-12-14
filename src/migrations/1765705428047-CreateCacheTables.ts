import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCacheTables1765705428047 implements MigrationInterface {
    name = 'CreateCacheTables1765705428047';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create cache table
        await queryRunner.query(`
            CREATE TABLE \`cache\` (
                \`key\` varchar(255) NOT NULL,
                \`value\` mediumtext NOT NULL,
                \`expiration\` int NOT NULL,
                PRIMARY KEY (\`key\`),
                INDEX \`IDX_cache_expiration\` (\`expiration\`)
            ) ENGINE=InnoDB
        `);

        // Create cache_locks table
        await queryRunner.query(`
            CREATE TABLE \`cache_locks\` (
                \`key\` varchar(255) NOT NULL,
                \`owner\` varchar(255) NOT NULL,
                \`expiration\` int NOT NULL,
                PRIMARY KEY (\`key\`),
                INDEX \`IDX_cache_locks_expiration\` (\`expiration\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`cache_locks\``);
        await queryRunner.query(`DROP TABLE \`cache\``);
    }
}
