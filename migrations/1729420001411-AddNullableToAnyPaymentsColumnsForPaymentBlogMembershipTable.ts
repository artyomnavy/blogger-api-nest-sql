import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNullableToAnyPaymentsColumnsForPaymentBlogMembershipTable1729420001411
  implements MigrationInterface
{
  name =
    'AddNullableToAnyPaymentsColumnsForPaymentBlogMembershipTable1729420001411';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments_blogs_memberships" ALTER COLUMN "any_payment_provider_info" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments_blogs_memberships" ALTER COLUMN "any_confirm_payment_system_data" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments_blogs_memberships" ALTER COLUMN "any_confirm_payment_system_data" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments_blogs_memberships" ALTER COLUMN "any_payment_provider_info" SET NOT NULL`,
    );
  }
}
