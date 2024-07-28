import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCascadeDeleteForUserAndUserBanByAdminAndUserBanByBloggers1722192374191
  implements MigrationInterface
{
  name =
    'FixCascadeDeleteForUserAndUserBanByAdminAndUserBanByBloggers1722192374191';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users_bans_by_admin" DROP CONSTRAINT "FK_3f735311858ba10ce4a6df329c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_bans_by_bloggers" DROP CONSTRAINT "FK_3d0d550a10ac273648d3d064a16"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_e92df35ca43d8de7cda91c9460d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_68fe504f54dc8ded5431d85b5d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_bans_by_admin" ADD CONSTRAINT "FK_3f735311858ba10ce4a6df329c5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_bans_by_bloggers" ADD CONSTRAINT "FK_3d0d550a10ac273648d3d064a16" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_68fe504f54dc8ded5431d85b5d5" FOREIGN KEY ("user_ban_by_admin_id") REFERENCES "users_bans_by_admin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_e92df35ca43d8de7cda91c9460d" FOREIGN KEY ("user_ban_by_bloggers_id") REFERENCES "users_bans_by_bloggers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "users" ADD CONSTRAINT "FK_68fe504f54dc8ded5431d85b5d5" FOREIGN KEY ("user_ban_by_admin_id") REFERENCES "users_bans_by_admin"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_e92df35ca43d8de7cda91c9460d" FOREIGN KEY ("user_ban_by_bloggers_id") REFERENCES "users_bans_by_bloggers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_bans_by_bloggers" ADD CONSTRAINT "FK_3d0d550a10ac273648d3d064a16" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_bans_by_admin" ADD CONSTRAINT "FK_3f735311858ba10ce4a6df329c5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
