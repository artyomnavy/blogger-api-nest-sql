import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAndAddColumnsToBlogSubscriptionTableAndCreatePaymentBlogMembership1728758200041
  implements MigrationInterface
{
  name =
    'FixAndAddColumnsToBlogSubscriptionTableAndCreatePaymentBlogMembership1728758200041';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "payments_blogs_memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "payment_system" character varying NOT NULL, "price" double precision NOT NULL, "status" character varying NOT NULL, "any_payment_provider_info" json NOT NULL, "any_confirm_payment_system_data" json NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "blog_subscription_id" uuid, CONSTRAINT "PK_cbdacf2e9fa6f8a12c4aae62981" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_memberships_plans" ADD "blog_subscription_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" ADD "price" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" ADD "expiration_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_memberships_plans" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_memberships_plans" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_memberships_plans" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_memberships_plans" ADD CONSTRAINT "FK_63bce360a9836f697d888b970f7" FOREIGN KEY ("blog_subscription_id") REFERENCES "blogs_subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments_blogs_memberships" ADD CONSTRAINT "FK_872fac6ff6564c3969ba672cc56" FOREIGN KEY ("blog_subscription_id") REFERENCES "blogs_subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments_blogs_memberships" DROP CONSTRAINT "FK_872fac6ff6564c3969ba672cc56"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_memberships_plans" DROP CONSTRAINT "FK_63bce360a9836f697d888b970f7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" ALTER COLUMN "updated_at" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" ALTER COLUMN "created_at" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_memberships_plans" ALTER COLUMN "updated_at" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_memberships_plans" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_memberships_plans" ALTER COLUMN "created_at" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" DROP COLUMN "expiration_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_subscriptions" DROP COLUMN "price"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_memberships_plans" DROP COLUMN "blog_subscription_id"`,
    );
    await queryRunner.query(`DROP TABLE "payments_blogs_memberships"`);
  }
}
