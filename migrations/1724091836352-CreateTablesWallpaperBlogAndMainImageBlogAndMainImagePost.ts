import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTablesWallpaperBlogAndMainImageBlogAndMainImagePost1724091836352
  implements MigrationInterface
{
  name =
    'CreateTablesWallpaperBlogAndMainImageBlogAndMainImagePost1724091836352';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "blogs_wallpapers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" integer NOT NULL, "width" integer NOT NULL, "height" integer NOT NULL, "file_size" integer NOT NULL, "blog_id" uuid, CONSTRAINT "REL_4a80b6e1539fb1c8cfa5d7a70d" UNIQUE ("blog_id"), CONSTRAINT "PK_987cf1bc19854902e360c90d868" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "blogs_main_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" integer NOT NULL, "width" integer NOT NULL, "height" integer NOT NULL, "file_size" integer NOT NULL, "blog_id" uuid, CONSTRAINT "REL_478308f96a4049ebbb90d15759" UNIQUE ("blog_id"), CONSTRAINT "PK_03345796caed2480ab8d93ebb44" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "posts_main_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" integer NOT NULL, "width" integer NOT NULL, "height" integer NOT NULL, "file_size" integer NOT NULL, "image_size" integer NOT NULL, "post_id" uuid, CONSTRAINT "REL_50d36b7c574e0aefd172f54235" UNIQUE ("post_id"), CONSTRAINT "PK_d291ae46b8c065303c6f369a62f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "blogs" ADD "blog_wallpaper_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD CONSTRAINT "UQ_a7f79bfc9db7a1b75ab6f0f11fb" UNIQUE ("blog_wallpaper_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD "blog_main_image_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD CONSTRAINT "UQ_e1b32987e0875b7bc6ce4d61147" UNIQUE ("blog_main_image_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "post_main_image_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "UQ_36aa688d824fe70ed8144fae758" UNIQUE ("post_main_image_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_wallpapers" ADD CONSTRAINT "FK_4a80b6e1539fb1c8cfa5d7a70de" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_main_images" ADD CONSTRAINT "FK_478308f96a4049ebbb90d157593" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD CONSTRAINT "FK_a7f79bfc9db7a1b75ab6f0f11fb" FOREIGN KEY ("blog_wallpaper_id") REFERENCES "blogs_wallpapers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD CONSTRAINT "FK_e1b32987e0875b7bc6ce4d61147" FOREIGN KEY ("blog_main_image_id") REFERENCES "blogs_main_images"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts_main_images" ADD CONSTRAINT "FK_50d36b7c574e0aefd172f542358" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_36aa688d824fe70ed8144fae758" FOREIGN KEY ("post_main_image_id") REFERENCES "posts_main_images"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_36aa688d824fe70ed8144fae758"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts_main_images" DROP CONSTRAINT "FK_50d36b7c574e0aefd172f542358"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP CONSTRAINT "FK_e1b32987e0875b7bc6ce4d61147"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP CONSTRAINT "FK_a7f79bfc9db7a1b75ab6f0f11fb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_main_images" DROP CONSTRAINT "FK_478308f96a4049ebbb90d157593"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_wallpapers" DROP CONSTRAINT "FK_4a80b6e1539fb1c8cfa5d7a70de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "UQ_36aa688d824fe70ed8144fae758"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP COLUMN "post_main_image_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP CONSTRAINT "UQ_e1b32987e0875b7bc6ce4d61147"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP COLUMN "blog_main_image_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP CONSTRAINT "UQ_a7f79bfc9db7a1b75ab6f0f11fb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP COLUMN "blog_wallpaper_id"`,
    );
    await queryRunner.query(`DROP TABLE "posts_main_images"`);
    await queryRunner.query(`DROP TABLE "blogs_main_images"`);
    await queryRunner.query(`DROP TABLE "blogs_wallpapers"`);
  }
}
