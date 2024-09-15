import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixRelationBlogSubscriberAndBlog1726409837756
  implements MigrationInterface
{
  name = 'FixRelationBlogSubscriberAndBlog1726409837756';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP CONSTRAINT "FK_9728ee7386486ed6752b06983e8"`,
    );
    await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "blog_id"`);
    await queryRunner.query(
      `ALTER TABLE "blogs_subscribers" ADD "blog_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscribers" ADD CONSTRAINT "FK_d372ffe579f20e8c39a7c2df768" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blogs_subscribers" DROP CONSTRAINT "FK_d372ffe579f20e8c39a7c2df768"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscribers" DROP COLUMN "blog_id"`,
    );
    await queryRunner.query(`ALTER TABLE "blogs" ADD "blog_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD CONSTRAINT "FK_9728ee7386486ed6752b06983e8" FOREIGN KEY ("blog_id") REFERENCES "blogs_subscribers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
