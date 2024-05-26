import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import {
  QuestionModel,
  QuestionOutputModel,
} from '../api/models/question.output.model';
import { Question } from '../domain/question.entity';
import { PublishedStatuses } from '../../../utils';

@Injectable()
export class QuestionsQueryRepository {
  constructor(
    @InjectRepository(Question)
    private readonly questionsQueryRepository: Repository<Question>,
  ) {}
  async getAllQuestions(queryData: PaginatorModel) {
    const bodySearchTerm = queryData.bodySearchTerm
      ? queryData.bodySearchTerm
      : '';
    const publishedStatus = queryData.publishedStatus
      ? queryData.publishedStatus
      : PublishedStatuses.ALL;
    const sortBy = queryData.sortBy ? queryData.sortBy : 'createdAt';
    const sortDirection = queryData.sortDirection
      ? (queryData.sortDirection.toUpperCase() as 'ASC' | 'DESC')
      : 'DESC';
    const pageNumber = queryData.pageNumber ? +queryData.pageNumber : 1;
    const pageSize = queryData.pageSize ? +queryData.pageSize : 10;

    let status: boolean | null;

    switch (publishedStatus) {
      case PublishedStatuses.PUBLISHED:
        status = true;
        break;
      case PublishedStatuses.NOT_PUBLISHED:
        status = false;
        break;
      default:
        status = null;
    }

    // const questions = await this.questionsQueryRepository
    //   .createQueryBuilder('q')
    //   .select([
    //     'q.id',
    //     'q.body',
    //     'q.correctAnswers',
    //     'q.published',
    //     'q.createdAt',
    //     'q.updatedAt',
    //   ])
    //   .where('q.body ILIKE :body', { body: `%${bodySearchTerm}%` })
    //   .andWhere('q.published = :published AND :published IS NOT NULL', {
    //     published: status,
    //   })
    //   .orderBy(`q.${sortBy}`, sortDirection)
    //   .skip((pageNumber - 1) * pageSize)
    //   .take(pageSize)
    //   .getMany();

    const questions = await this.questionsQueryRepository
      .createQueryBuilder('q')
      .select([
        'q.id',
        'q.body',
        'q.correctAnswers',
        'q.published',
        'q.createdAt',
        'q.updatedAt',
      ])
      .where('q.body ILIKE :body', { body: `%${bodySearchTerm}%` })
      .andWhere(
        status === null
          ? 'q.published IS NOT NULL'
          : 'q.published = :published',
        {
          published: status,
        },
      )
      .orderBy(`q.${sortBy}`, sortDirection)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const totalCount: number = await this.questionsQueryRepository
      .createQueryBuilder('q')
      .select('COUNT(q.id)')
      .where('q.body ILIKE :body', { body: `%${bodySearchTerm}%` })
      .andWhere(
        status === null
          ? 'q.published IS NOT NULL'
          : 'q.published = :published',
        {
          published: status,
        },
      )
      .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: await Promise.all(
        questions.map((question: QuestionModel) =>
          this.questionMapper(question),
        ),
      ),
    };
  }
  async getQuestionById(id: string): Promise<QuestionModel | null> {
    const question = await this.questionsQueryRepository
      .createQueryBuilder()
      .select([
        'q.id',
        'q.body',
        'q.correctAnswers',
        'q.published',
        'q.createdAt',
        'q.updatedAt',
      ])
      .from(Question, 'q')
      .where('q.id = :id', { id })
      .getOne();

    if (!question) {
      return null;
    } else {
      return question;
    }
  }
  async getFiveRandomQuestions(): Promise<Question[]> {
    const randomQuestions = await this.questionsQueryRepository
      .createQueryBuilder('q')
      .select([
        'q.id',
        'q.body',
        'q.correctAnswers',
        'q.published',
        'q.createdAt',
        'q.updatedAt',
      ])
      .where('q.published = :published', { published: true })
      .orderBy('RANDOM()')
      .take(5)
      .getMany();

    return randomQuestions;
  }
  async getQuestionByIdForQuiz(questionId: string): Promise<Question | null> {
    const question = await this.questionsQueryRepository.findOneBy({
      id: questionId,
    });

    if (!question) {
      return null;
    } else {
      return question;
    }
  }
  async questionMapper(question: QuestionModel): Promise<QuestionOutputModel> {
    return {
      id: question.id,
      body: question.body,
      correctAnswers: [...question.correctAnswers],
      published: question.published,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt ? question.updatedAt.toISOString() : null,
    };
  }
}
