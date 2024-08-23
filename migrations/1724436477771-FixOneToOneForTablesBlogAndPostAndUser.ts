import { MigrationInterface, QueryRunner } from "typeorm";

export class FixOneToOneForTablesBlogAndPostAndUser1724436477771 implements MigrationInterface {
    name = 'FixOneToOneForTablesBlogAndPostAndUser1724436477771'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "FK_bead373aa771c0778b114ad89d0"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "FK_e1b32987e0875b7bc6ce4d61147"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "FK_a7f79bfc9db7a1b75ab6f0f11fb"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_36aa688d824fe70ed8144fae758"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_68fe504f54dc8ded5431d85b5d5"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c5c86bfe7550339e83d0fcbf9fd"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "UQ_bead373aa771c0778b114ad89d0"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "blog_ban_by_admin_id"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "UQ_a7f79bfc9db7a1b75ab6f0f11fb"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "blog_wallpaper_id"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "UQ_e1b32987e0875b7bc6ce4d61147"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "blog_main_image_id"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "UQ_36aa688d824fe70ed8144fae758"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "post_main_image_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_68fe504f54dc8ded5431d85b5d5"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "user_ban_by_admin_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_c5c86bfe7550339e83d0fcbf9fd"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "user_ban_by_blogger_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "user_ban_by_blogger_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_c5c86bfe7550339e83d0fcbf9fd" UNIQUE ("user_ban_by_blogger_id")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "user_ban_by_admin_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_68fe504f54dc8ded5431d85b5d5" UNIQUE ("user_ban_by_admin_id")`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "post_main_image_id" uuid`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "UQ_36aa688d824fe70ed8144fae758" UNIQUE ("post_main_image_id")`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "blog_main_image_id" uuid`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD CONSTRAINT "UQ_e1b32987e0875b7bc6ce4d61147" UNIQUE ("blog_main_image_id")`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "blog_wallpaper_id" uuid`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD CONSTRAINT "UQ_a7f79bfc9db7a1b75ab6f0f11fb" UNIQUE ("blog_wallpaper_id")`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "blog_ban_by_admin_id" uuid`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD CONSTRAINT "UQ_bead373aa771c0778b114ad89d0" UNIQUE ("blog_ban_by_admin_id")`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c5c86bfe7550339e83d0fcbf9fd" FOREIGN KEY ("user_ban_by_blogger_id") REFERENCES "users_bans_by_bloggers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_68fe504f54dc8ded5431d85b5d5" FOREIGN KEY ("user_ban_by_admin_id") REFERENCES "users_bans_by_admin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_36aa688d824fe70ed8144fae758" FOREIGN KEY ("post_main_image_id") REFERENCES "posts_main_images"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD CONSTRAINT "FK_a7f79bfc9db7a1b75ab6f0f11fb" FOREIGN KEY ("blog_wallpaper_id") REFERENCES "blogs_wallpapers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD CONSTRAINT "FK_e1b32987e0875b7bc6ce4d61147" FOREIGN KEY ("blog_main_image_id") REFERENCES "blogs_main_images"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD CONSTRAINT "FK_bead373aa771c0778b114ad89d0" FOREIGN KEY ("blog_ban_by_admin_id") REFERENCES "blogs_bans_by_admin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
