import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTypeColumnImageSizeForTablePostMainImage1724955419928
  implements MigrationInterface
{
  name = 'FixTypeColumnImageSizeForTablePostMainImage1724955419928';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts_main_images" DROP COLUMN "image_size"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts_main_images" ADD "image_size" character varying NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts_main_images" DROP COLUMN "image_size"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts_main_images" ADD "image_size" integer NOT NULL`,
    );
  }
}
