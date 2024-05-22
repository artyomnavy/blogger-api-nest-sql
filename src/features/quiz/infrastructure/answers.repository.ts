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

    const createAnswer = await this.answersRepository.save(newAnswer);

    return {
      questionId: createAnswer!.question.id,
      answerStatus: createAnswer!.answerStatus,
      addedAt: createAnswer!.addedAt.toISOString(),
    };
  }
}
