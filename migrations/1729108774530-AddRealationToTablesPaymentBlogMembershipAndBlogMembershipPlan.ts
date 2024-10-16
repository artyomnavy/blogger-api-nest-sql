import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRealationToTablesPaymentBlogMembershipAndBlogMembershipPlan1729108774530
  implements MigrationInterface
{
  name =
    'AddRealationToTablesPaymentBlogMembershipAndBlogMembershipPlan1729108774530';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments_blogs_memberships" ADD "blog_membership_plan_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments_blogs_memberships" ADD CONSTRAINT "UQ_130d0537e35fd41046457eb74c9" UNIQUE ("blog_membership_plan_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments_blogs_memberships" ADD CONSTRAINT "FK_130d0537e35fd41046457eb74c9" FOREIGN KEY ("blog_membership_plan_id") REFERENCES "blogs_memberships_plans"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments_blogs_memberships" DROP CONSTRAINT "FK_130d0537e35fd41046457eb74c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments_blogs_memberships" DROP CONSTRAINT "UQ_130d0537e35fd41046457eb74c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments_blogs_memberships" DROP COLUMN "blog_membership_plan_id"`,
    );
  }
}
