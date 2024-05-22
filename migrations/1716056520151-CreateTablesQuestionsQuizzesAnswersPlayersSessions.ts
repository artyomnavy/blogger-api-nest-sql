import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTablesQuestionsQuizzesAnswersPlayersSessions1716056520151 implements MigrationInterface {
    name = 'CreateTablesQuestionsQuizzesAnswersPlayersSessions1716056520151'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."quizzes_status_enum" AS ENUM('PendingSecondPlayer', 'Active', 'Finished')`);
        await queryRunner.query(`CREATE TABLE "quizzes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."quizzes_status_enum" NOT NULL, "pair_create_date" TIMESTAMP WITH TIME ZONE NOT NULL, "start_game_date" TIMESTAMP WITH TIME ZONE, "finish_game_date" TIMESTAMP WITH TIME ZONE, "first_player_session_id" uuid, "second_player_session_id" uuid, CONSTRAINT "REL_5202a78d1a23436afe49a4ed70" UNIQUE ("first_player_session_id"), CONSTRAINT "REL_74d5ba0218da66c1953b061f62" UNIQUE ("second_player_session_id"), CONSTRAINT "PK_b24f0f7662cf6b3a0e7dba0a1b4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "body" character varying(500) COLLATE "C" NOT NULL, "correct_answers" character varying array COLLATE "C" NOT NULL, "published" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."answers_answer_status_enum" AS ENUM('Correct', 'Incorrect')`);
        await queryRunner.query(`CREATE TABLE "answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "body" character varying COLLATE "C" NOT NULL, "answer_status" "public"."answers_answer_status_enum" NOT NULL, "added_at" TIMESTAMP WITH TIME ZONE NOT NULL, "player_session_id" uuid, "question_id" uuid, CONSTRAINT "PK_9c32cec6c71e06da0254f2226c6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "players_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "score" integer NOT NULL DEFAULT '0', "player_id" uuid, CONSTRAINT "PK_b4ea32ed842189e1804a82d1e1f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "quizzes_questions" ("quiz_id" uuid NOT NULL, "question_id" uuid NOT NULL, CONSTRAINT "PK_0453b1eee9116b2f39f5b61e62a" PRIMARY KEY ("quiz_id", "question_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4a4f46287278c35a92a8466fe1" ON "quizzes_questions" ("quiz_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2db1c227456ea298f25530a00e" ON "quizzes_questions" ("question_id") `);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD CONSTRAINT "FK_5202a78d1a23436afe49a4ed70c" FOREIGN KEY ("first_player_session_id") REFERENCES "players_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD CONSTRAINT "FK_74d5ba0218da66c1953b061f625" FOREIGN KEY ("second_player_session_id") REFERENCES "players_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "answers" ADD CONSTRAINT "FK_836e9aa54363f2be82c5885c8d9" FOREIGN KEY ("player_session_id") REFERENCES "players_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "answers" ADD CONSTRAINT "FK_677120094cf6d3f12df0b9dc5d3" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "players_sessions" ADD CONSTRAINT "FK_9dbb979dec9dc7d5967fe7d5bdb" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quizzes_questions" ADD CONSTRAINT "FK_4a4f46287278c35a92a8466fe1a" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "quizzes_questions" ADD CONSTRAINT "FK_2db1c227456ea298f25530a00e9" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quizzes_questions" DROP CONSTRAINT "FK_2db1c227456ea298f25530a00e9"`);
        await queryRunner.query(`ALTER TABLE "quizzes_questions" DROP CONSTRAINT "FK_4a4f46287278c35a92a8466fe1a"`);
        await queryRunner.query(`ALTER TABLE "players_sessions" DROP CONSTRAINT "FK_9dbb979dec9dc7d5967fe7d5bdb"`);
        await queryRunner.query(`ALTER TABLE "answers" DROP CONSTRAINT "FK_677120094cf6d3f12df0b9dc5d3"`);
        await queryRunner.query(`ALTER TABLE "answers" DROP CONSTRAINT "FK_836e9aa54363f2be82c5885c8d9"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP CONSTRAINT "FK_74d5ba0218da66c1953b061f625"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP CONSTRAINT "FK_5202a78d1a23436afe49a4ed70c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2db1c227456ea298f25530a00e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4a4f46287278c35a92a8466fe1"`);
        await queryRunner.query(`DROP TABLE "quizzes_questions"`);
        await queryRunner.query(`DROP TABLE "players_sessions"`);
        await queryRunner.query(`DROP TABLE "answers"`);
        await queryRunner.query(`DROP TYPE "public"."answers_answer_status_enum"`);
        await queryRunner.query(`DROP TABLE "questions"`);
        await queryRunner.query(`DROP TABLE "quizzes"`);
        await queryRunner.query(`DROP TYPE "public"."quizzes_status_enum"`);
    }

}
