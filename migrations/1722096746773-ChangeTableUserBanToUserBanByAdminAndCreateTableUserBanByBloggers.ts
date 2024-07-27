import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTableUserBanToUserBanByAdminAndCreateTableUserBanByBloggers1722096746773
  implements MigrationInterface
{
  name =
    'ChangeTableUserBanToUserBanByAdminAndCreateTableUserBanByBloggers1722096746773';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_2c44845ca935ddd18da56898db7"`,
    );
    await queryRunner.query(
      `CREATE TABLE "users_bans_by_admin" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "banned" boolean NOT NULL DEFAULT false, "ban_date" TIMESTAMP WITH TIME ZONE, "ban_reason" character varying, "user_id" uuid, CONSTRAINT "REL_3f735311858ba10ce4a6df329c" UNIQUE ("user_id"), CONSTRAINT "PK_08852dca2afb9de3d15a8600d03" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users_bans_by_bloggers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "banned" boolean NOT NULL DEFAULT false, "ban_date" TIMESTAMP WITH TIME ZONE, "ban_reason" character varying, "blog_id" character varying, "user_id" uuid, CONSTRAINT "REL_3d0d550a10ac273648d3d064a1" UNIQUE ("user_id"), CONSTRAINT "PK_bf2ca0490bd608b2ec333525ef0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_2c44845ca935ddd18da56898db7"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "user_ban_id"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "user_ban_by_admin_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_68fe504f54dc8ded5431d85b5d5" UNIQUE ("user_ban_by_admin_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "user_ban_by_bloggers_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_e92df35ca43d8de7cda91c9460d" UNIQUE ("user_ban_by_bloggers_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_bans_by_admin" ADD CONSTRAINT "FK_3f735311858ba10ce4a6df329c5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_bans_by_bloggers" ADD CONSTRAINT "FK_3d0d550a10ac273648d3d064a16" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_68fe504f54dc8ded5431d85b5d5" FOREIGN KEY ("user_ban_by_admin_id") REFERENCES "users_bans_by_admin"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_e92df35ca43d8de7cda91c9460d" FOREIGN KEY ("user_ban_by_bloggers_id") REFERENCES "users_bans_by_bloggers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_e92df35ca43d8de7cda91c9460d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_68fe504f54dc8ded5431d85b5d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_bans_by_bloggers" DROP CONSTRAINT "FK_3d0d550a10ac273648d3d064a16"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_bans_by_admin" DROP CONSTRAINT "FK_3f735311858ba10ce4a6df329c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_e92df35ca43d8de7cda91c9460d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "user_ban_by_bloggers_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_68fe504f54dc8ded5431d85b5d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "user_ban_by_admin_id"`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "user_ban_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_2c44845ca935ddd18da56898db7" UNIQUE ("user_ban_id")`,
    );
    await queryRunner.query(`DROP TABLE "users_bans_by_bloggers"`);
    await queryRunner.query(`DROP TABLE "users_bans_by_admin"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_2c44845ca935ddd18da56898db7" FOREIGN KEY ("user_ban_id") REFERENCES "users_bans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
