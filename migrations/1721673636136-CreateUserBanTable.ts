import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserBanTable1721673636136 implements MigrationInterface {
  name = 'CreateUserBanTable1721673636136';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users_bans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "banned" boolean NOT NULL DEFAULT false, "ban_date" TIMESTAMP WITH TIME ZONE, "ban_reason" character varying, "user_id" uuid, CONSTRAINT "REL_2c551cbd27a8b63ff899bf9331" UNIQUE ("user_id"), CONSTRAINT "PK_58df2acd559c6d874e509560673" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "user_ban_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_2c44845ca935ddd18da56898db7" UNIQUE ("user_ban_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_bans" ADD CONSTRAINT "FK_2c551cbd27a8b63ff899bf93310" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_2c44845ca935ddd18da56898db7" FOREIGN KEY ("user_ban_id") REFERENCES "users_bans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_2c44845ca935ddd18da56898db7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_bans" DROP CONSTRAINT "FK_2c551cbd27a8b63ff899bf93310"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_2c44845ca935ddd18da56898db7"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "user_ban_id"`);
    await queryRunner.query(`DROP TABLE "users_bans"`);
  }
}
