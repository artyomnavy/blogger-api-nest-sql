import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableBlogBanByAdmin1722364534785 implements MigrationInterface {
    name = 'CreateTableBlogBanByAdmin1722364534785'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "blogs_bans_by_admin" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "is_banned" boolean NOT NULL DEFAULT false, "ban_date" TIMESTAMP WITH TIME ZONE, "blog_id" uuid, CONSTRAINT "REL_a85ce88074785d7ca6bcbe00c6" UNIQUE ("blog_id"), CONSTRAINT "PK_acfdcb4bd98c4f0a45009f5905f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "blog_ban_by_admin_id" uuid`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD CONSTRAINT "UQ_bead373aa771c0778b114ad89d0" UNIQUE ("blog_ban_by_admin_id")`);
        await queryRunner.query(`ALTER TABLE "blogs_bans_by_admin" ADD CONSTRAINT "FK_a85ce88074785d7ca6bcbe00c6e" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD CONSTRAINT "FK_bead373aa771c0778b114ad89d0" FOREIGN KEY ("blog_ban_by_admin_id") REFERENCES "blogs_bans_by_admin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "FK_bead373aa771c0778b114ad89d0"`);
        await queryRunner.query(`ALTER TABLE "blogs_bans_by_admin" DROP CONSTRAINT "FK_a85ce88074785d7ca6bcbe00c6e"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "UQ_bead373aa771c0778b114ad89d0"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "blog_ban_by_admin_id"`);
        await queryRunner.query(`DROP TABLE "blogs_bans_by_admin"`);
    }

}
