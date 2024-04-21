import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTablesUsersDevicesBlogsPostsCommentsLikes1713700914611
  implements MigrationInterface
{
  name = 'CreateTablesUsersDevicesBlogsPostsCommentsLikes1713700914611';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "iat" TIMESTAMP NOT NULL, "exp" TIMESTAMP WITH TIME ZONE NOT NULL, "ip" character varying NOT NULL, "device_name" character varying NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "likes_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "comment_id" uuid NOT NULL, "user_id" uuid NOT NULL, "status" character varying NOT NULL, "added_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_1f998c484b8e003a951dc0bcfc8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" character varying(300) COLLATE "C" NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "post_id" uuid NOT NULL, CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "blogs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(15) COLLATE "C" NOT NULL, "description" character varying(500) COLLATE "C" NOT NULL, "website_url" character varying(100) COLLATE "C" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "is_membership" boolean NOT NULL DEFAULT false, "user_id" uuid, CONSTRAINT "PK_e113335f11c926da929a625f118" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(30) COLLATE "C" NOT NULL, "short_description" character varying(100) COLLATE "C" NOT NULL, "content" character varying(1000) COLLATE "C" NOT NULL, "blog_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "likes_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "post_id" uuid NOT NULL, "user_id" uuid NOT NULL, "status" character varying NOT NULL, "added_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_700a22aa0bad878ccc8ebb8ba81" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "login" character varying(10) COLLATE "C" NOT NULL, "password" character varying NOT NULL, "email" character varying COLLATE "C" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "confirmation_code" character varying, "expiration_date" TIMESTAMP WITH TIME ZONE, "is_confirmed" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_2d443082eccd5198f95f2a36e2c" UNIQUE ("login"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" ADD CONSTRAINT "FK_5e9bee993b4ce35c3606cda194c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes_comments" ADD CONSTRAINT "FK_094a34ab526c9617cf7c261c15e" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes_comments" ADD CONSTRAINT "FK_7308db24de1e49ec93489eece53" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_4c675567d2a58f0b07cef09c13d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD CONSTRAINT "FK_57d7c984ba4a3fa3b4ea2fb5553" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_7689491fe4377a8090576a799a0" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes_posts" ADD CONSTRAINT "FK_ce551716fa81636c9befe526391" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes_posts" ADD CONSTRAINT "FK_5eca95fe513d96a0c7727ea4ad5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "likes_posts" DROP CONSTRAINT "FK_5eca95fe513d96a0c7727ea4ad5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes_posts" DROP CONSTRAINT "FK_ce551716fa81636c9befe526391"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_7689491fe4377a8090576a799a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP CONSTRAINT "FK_57d7c984ba4a3fa3b4ea2fb5553"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_4c675567d2a58f0b07cef09c13d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes_comments" DROP CONSTRAINT "FK_7308db24de1e49ec93489eece53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes_comments" DROP CONSTRAINT "FK_094a34ab526c9617cf7c261c15e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" DROP CONSTRAINT "FK_5e9bee993b4ce35c3606cda194c"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "likes_posts"`);
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP TABLE "blogs"`);
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`DROP TABLE "likes_comments"`);
    await queryRunner.query(`DROP TABLE "devices"`);
  }
}
