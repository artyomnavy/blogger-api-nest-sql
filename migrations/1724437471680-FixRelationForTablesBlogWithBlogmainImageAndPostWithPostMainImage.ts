import { MigrationInterface, QueryRunner } from "typeorm";

export class FixRelationForTablesBlogWithBlogmainImageAndPostWithPostMainImage1724437471680 implements MigrationInterface {
    name = 'FixRelationForTablesBlogWithBlogmainImageAndPostWithPostMainImage1724437471680'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blogs_main_images" DROP CONSTRAINT "FK_478308f96a4049ebbb90d157593"`);
        await queryRunner.query(`ALTER TABLE "blogs_main_images" DROP CONSTRAINT "REL_478308f96a4049ebbb90d15759"`);
        await queryRunner.query(`ALTER TABLE "posts_main_images" DROP CONSTRAINT "FK_50d36b7c574e0aefd172f542358"`);
        await queryRunner.query(`ALTER TABLE "posts_main_images" DROP CONSTRAINT "REL_50d36b7c574e0aefd172f54235"`);
        await queryRunner.query(`ALTER TABLE "blogs_main_images" ADD CONSTRAINT "FK_478308f96a4049ebbb90d157593" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts_main_images" ADD CONSTRAINT "FK_50d36b7c574e0aefd172f542358" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts_main_images" DROP CONSTRAINT "FK_50d36b7c574e0aefd172f542358"`);
        await queryRunner.query(`ALTER TABLE "blogs_main_images" DROP CONSTRAINT "FK_478308f96a4049ebbb90d157593"`);
        await queryRunner.query(`ALTER TABLE "posts_main_images" ADD CONSTRAINT "REL_50d36b7c574e0aefd172f54235" UNIQUE ("post_id")`);
        await queryRunner.query(`ALTER TABLE "posts_main_images" ADD CONSTRAINT "FK_50d36b7c574e0aefd172f542358" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blogs_main_images" ADD CONSTRAINT "REL_478308f96a4049ebbb90d15759" UNIQUE ("blog_id")`);
        await queryRunner.query(`ALTER TABLE "blogs_main_images" ADD CONSTRAINT "FK_478308f96a4049ebbb90d157593" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
