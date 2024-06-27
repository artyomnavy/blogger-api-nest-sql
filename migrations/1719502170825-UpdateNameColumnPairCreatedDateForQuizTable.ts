import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateNameColumnPairCreatedDateForQuizTable1719502170825
  implements MigrationInterface
{
  name = 'UpdateNameColumnPairCreatedDateForQuizTable1719502170825';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quizzes" RENAME COLUMN "pair_create_date" TO "pair_created_date"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quizzes" RENAME COLUMN "pair_created_date" TO "pair_create_date"`,
    );
  }
}
