import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixColumnsSettingsBlogSubscriber1726424900805
  implements MigrationInterface
{
  name = 'FixColumnsSettingsBlogSubscriber1726424900805';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blogs_subscribers" ALTER COLUMN "telegram_code" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscribers" ALTER COLUMN "telegram_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blogs_subscribers" ALTER COLUMN "telegram_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscribers" ALTER COLUMN "telegram_code" SET NOT NULL`,
    );
  }
}
