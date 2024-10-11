import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnsToBlogSubscriptionTableAndCreateBlogMembershipPlanTable1728674176728
  implements MigrationInterface
{
  name =
    'AddColumnsToBlogSubscriptionTableAndCreateBlogMembershipPlanTable1728674176728';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "blogs_memberships_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plan_name" character varying NOT NULL, "months_count" integer NOT NULL, "price" double precision NOT NULL, "currency" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE, "blog_id" uuid, CONSTRAINT "PK_c68cb4f26aba5e35e4f12a88c1a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" ADD "updated_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_memberships_plans" ADD CONSTRAINT "FK_602c6f05504b40bc98dc384aca2" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blogs_memberships_plans" DROP CONSTRAINT "FK_602c6f05504b40bc98dc384aca2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(`DROP TABLE "blogs_memberships_plans"`);
  }
}
