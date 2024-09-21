import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTableBlogSubscriberToBlogSubscription1726768284660
  implements MigrationInterface
{
  name = 'RenameTableBlogSubscriberToBlogSubscription1726768284660';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "blogs_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "telegram_code" uuid, "telegram_id" integer, "status" character varying NOT NULL, "blog_id" uuid, "user_id" uuid, CONSTRAINT "PK_f0e358a0b611182386e5e0c56ae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" ADD CONSTRAINT "FK_4c396b0500551dbe4aba8db86b1" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" ADD CONSTRAINT "FK_85f7f22e2c7f369f260d62b4b99" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" DROP CONSTRAINT "FK_85f7f22e2c7f369f260d62b4b99"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" DROP CONSTRAINT "FK_4c396b0500551dbe4aba8db86b1"`,
    );
    await queryRunner.query(`DROP TABLE "blogs_subscriptions"`);
  }
}
