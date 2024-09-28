import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTypeColumnTelegramIdForBlogSubscriptionTable1727518138042
  implements MigrationInterface
{
  name = 'FixTypeColumnTelegramIdForBlogSubscriptionTable1727518138042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" DROP COLUMN "telegram_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" ADD "telegram_id" bigint`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" DROP COLUMN "telegram_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" ADD "telegram_id" integer`,
    );
  }
}
