import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixRelationsForTablesUserAndUserBanByAdminAndUserBanByBloggers1722193959236
  implements MigrationInterface
{
  name =
    'FixRelationsForTablesUserAndUserBanByAdminAndUserBanByBloggers1722193959236';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_e92df35ca43d8de7cda91c9460d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "user_ban_by_bloggers_id" TO "user_ban_by_blogger_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME CONSTRAINT "UQ_e92df35ca43d8de7cda91c9460d" TO "UQ_c5c86bfe7550339e83d0fcbf9fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_c5c86bfe7550339e83d0fcbf9fd" FOREIGN KEY ("user_ban_by_blogger_id") REFERENCES "users_bans_by_bloggers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_c5c86bfe7550339e83d0fcbf9fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME CONSTRAINT "UQ_c5c86bfe7550339e83d0fcbf9fd" TO "UQ_e92df35ca43d8de7cda91c9460d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "user_ban_by_blogger_id" TO "user_ban_by_bloggers_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_e92df35ca43d8de7cda91c9460d" FOREIGN KEY ("user_ban_by_bloggers_id") REFERENCES "users_bans_by_bloggers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
