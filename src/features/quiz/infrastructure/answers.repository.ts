import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Answer } from '../domain/answer.entity';
import { Repository } from 'typeorm';
import { AnswerOutputModel } from '../api/models/answer.output.model';

@Injectable()
export class AnswersRepository {
  constructor(
    @InjectRepository(Answer)
    private readonly answersRepository: Repository<Answer>,
  ) {}
  async createAnswer(answer: Answer): Promise<AnswerOutputModel> {
    const newAnswer = new Answer();

    newAnswer.id = answer.id;
    newAnswer.body = answer.body;
    newAnswer.answerStatus = answer.answerStatus;
    newAnswer.addedAt = answer.addedAt;
    newAnswer.playerSession = answer.playerSession;
    newAnswer.question = answer.question;

    // Создание ответа на вопрос игры в базе данных (обычным способом)
    // await this.answersRepository.save(newAnswer);

    // Создание ответа на вопрос игры в базе данных с блокировкой 'pessimistic_write'
    // 'pessimistic_write' - блокировка для исключения одновременной записи ответов игры
    // при конкуренции (гонке) за данными
    await this.answersRepository
      .createQueryBuilder()
      .setLock('pessimistic_write')
      .insert()
      .into(Answer)
      .values(newAnswer)
      .execute();

    return {
      questionId: answer.question.id,
      answerStatus: answer.answerStatus,
      addedAt: answer.addedAt.toISOString(),
    };
  }
}
