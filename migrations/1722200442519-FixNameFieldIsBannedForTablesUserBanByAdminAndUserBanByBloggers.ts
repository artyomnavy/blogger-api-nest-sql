import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixNameFieldIsBannedForTablesUserBanByAdminAndUserBanByBloggers1722200442519
  implements MigrationInterface
{
  name =
    'FixNameFieldIsBannedForTablesUserBanByAdminAndUserBanByBloggers1722200442519';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users_bans_by_admin" RENAME COLUMN "banned" TO "is_banned"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_bans_by_bloggers" RENAME COLUMN "banned" TO "is_banned"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users_bans_by_bloggers" RENAME COLUMN "is_banned" TO "banned"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_bans_by_admin" RENAME COLUMN "is_banned" TO "banned"`,
    );
  }
}
