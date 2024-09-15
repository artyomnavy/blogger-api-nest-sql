import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableBlogSubscriber1726384359446
  implements MigrationInterface
{
  name = 'CreateTableBlogSubscriber1726384359446';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "blogs_subscribers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "telegram_code" uuid NOT NULL, "telegram_id" integer NOT NULL, "status" character varying NOT NULL, "user_id" uuid, CONSTRAINT "PK_e3eed3285977b560740dbc95240" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "blogs" ADD "blog_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "blogs_subscribers" ADD CONSTRAINT "FK_e8501a5acbb6063d6140d0216f7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD CONSTRAINT "FK_9728ee7386486ed6752b06983e8" FOREIGN KEY ("blog_id") REFERENCES "blogs_subscribers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP CONSTRAINT "FK_9728ee7386486ed6752b06983e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscribers" DROP CONSTRAINT "FK_e8501a5acbb6063d6140d0216f7"`,
    );
    await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "blog_id"`);
    await queryRunner.query(`DROP TABLE "blogs_subscribers"`);
  }
}
