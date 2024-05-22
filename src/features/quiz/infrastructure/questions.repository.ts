import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  QuestionModel,
  QuestionOutputModel,
} from '../api/models/question.output.model';
import { QuestionsQueryRepository } from './questions.query-repository';
import { Question } from '../domain/question.entity';
import { CreateAndUpdateQuestionModel } from '../api/models/question.input.model';

@Injectable()
export class QuestionsRepository {
  constructor(
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    private readonly questionsQueryRepository: QuestionsQueryRepository,
  ) {}
  async createQuestion(
    newQuestion: QuestionModel,
  ): Promise<QuestionOutputModel> {
    await this.questionsRepository.insert(newQuestion);

    return await this.questionsQueryRepository.questionMapper(newQuestion);
  }
  async updateQuestion(
    id: string,
    updateData: CreateAndUpdateQuestionModel,
    updatedAt: Date,
  ): Promise<boolean> {
    const resultUpdateQuestion = await this.questionsRepository.update(id, {
      body: updateData.body,
      correctAnswers: updateData.correctAnswers,
      updatedAt: updatedAt,
    });

    return resultUpdateQuestion.affected === 1;
  }
  async updatePublishQuestion(
    id: string,
    published: boolean,
    updatedAt: Date,
  ): Promise<boolean> {
    const resultUpdatePublishQuestion = await this.questionsRepository.update(
      id,
      { published: published, updatedAt: updatedAt },
    );

    return resultUpdatePublishQuestion.affected === 1;
  }
  async deleteQuestion(id: string): Promise<boolean> {
    const resultDeleteQuestion = await this.questionsRepository.delete(id);

    return resultDeleteQuestion.affected === 1;
  }
}
