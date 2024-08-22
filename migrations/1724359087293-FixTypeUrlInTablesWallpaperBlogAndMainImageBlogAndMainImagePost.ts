import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTypeUrlInTablesWallpaperBlogAndMainImageBlogAndMainImagePost1724359087293
  implements MigrationInterface
{
  name =
    'FixTypeUrlInTablesWallpaperBlogAndMainImageBlogAndMainImagePost1724359087293';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blogs_wallpapers" DROP COLUMN "url"`);
    await queryRunner.query(
      `ALTER TABLE "blogs_wallpapers" ADD "url" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_main_images" DROP COLUMN "url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_main_images" ADD "url" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts_main_images" DROP COLUMN "url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts_main_images" ADD "url" character varying NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts_main_images" DROP COLUMN "url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts_main_images" ADD "url" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_main_images" DROP COLUMN "url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_main_images" ADD "url" integer NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "blogs_wallpapers" DROP COLUMN "url"`);
    await queryRunner.query(
      `ALTER TABLE "blogs_wallpapers" ADD "url" integer NOT NULL`,
    );
  }
}
