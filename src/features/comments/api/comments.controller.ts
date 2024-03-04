import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsQueryRepository } from '../infrastructure/comments.query-repository';
import { ObjectIdPipe } from '../../../common/pipes/object-id.pipe';
import { UpdateLikeModel } from '../../likes/api/models/like.input.model';
import { HTTP_STATUSES } from '../../../utils';
import { CreateAndUpdateCommentModel } from './models/comment.input.model';
import { JwtBearerAuthGuard } from '../../../common/guards/jwt-bearer-auth-guard.service';
import { CurrentUserId } from '../../../common/decorators/current-user-id.param.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteCommentCommand } from '../application/use-cases/delete-comment.use-case';
import { ChangeLikeStatusForCommentCommand } from '../application/use-cases/change-like-status-comment.use-case';
import { UpdateCommentCommand } from '../application/use-cases/update-comment.use-case';
import { Request } from 'express';

@Controller('comments')
export class CommentsController {
  constructor(
    protected commentsQueryRepository: CommentsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get(':id')
  async getComment(
    @Param('id', ObjectIdPipe) commentId: string,
    @Req() req: Request,
  ) {
    const userId = req.userId;

    const comment = await this.commentsQueryRepository.getCommentById(
      commentId,
      userId,
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    } else {
      return comment;
    }
  }

  @Put(':id/like-status')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async changeLikeStatusForComment(
    @Param('id', ObjectIdPipe) commentId: string,
    @Body() updateModel: UpdateLikeModel,
    @CurrentUserId() currentUserId: string,
  ) {
    const comment = await this.commentsQueryRepository.getCommentById(
      commentId,
      currentUserId,
    );

    if (!comment) throw new NotFoundException('Comment not found');

    const isUpdated = await this.commandBus.execute(
      new ChangeLikeStatusForCommentCommand(
        currentUserId,
        comment,
        updateModel.likeStatus,
      ),
    );

    if (isUpdated) return;
  }

  @Put(':id')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async updateComment(
    @Param('id', ObjectIdPipe) commentId: string,
    @CurrentUserId() currentUserId: string,
    @Body() updateModel: CreateAndUpdateCommentModel,
  ) {
    const comment = await this.commentsQueryRepository.getCommentById(
      commentId,
      currentUserId,
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    } else if (comment.commentatorInfo.userId !== currentUserId) {
      throw new ForbiddenException('Comment is not yours');
    }

    const isUpdated = await this.commandBus.execute(
      new UpdateCommentCommand(commentId, updateModel),
    );

    if (isUpdated) return;
  }

  @Delete(':id')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deleteComment(
    @Param('id', ObjectIdPipe) commentId: string,
    @CurrentUserId() currentUserId: string,
  ) {
    const comment = await this.commentsQueryRepository.getCommentById(
      commentId,
      currentUserId,
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    } else if (comment.commentatorInfo.userId !== currentUserId) {
      throw new ForbiddenException('Comment is not yours');
    }

    const isDeleted = await this.commandBus.execute(
      new DeleteCommentCommand(commentId),
    );

    if (isDeleted) return;
  }
}
