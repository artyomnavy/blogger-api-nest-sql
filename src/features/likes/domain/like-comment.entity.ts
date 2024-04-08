import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comment } from '../../comments/domain/comment.entity';
import { User } from '../../users/domain/user.entity';

@Entity({ name: 'likes_comments' })
export class LikeComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'comment_id', type: 'uuid' })
  commentId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column('character varying')
  status: string;

  @Column('timestamp with time zone', { name: 'added_at' })
  addedAt: Date;

  @ManyToOne(() => Comment, (c) => c.likesComments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @ManyToOne(() => User, (u) => u.likesComments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
