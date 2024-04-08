import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { LikeComment } from '../../likes/domain/like-comment.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'character varying',
    length: 300,
    collation: 'C',
  })
  content: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column('timestamp with time zone', { name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'post_id', type: 'uuid' })
  postId: string;

  @OneToMany(() => LikeComment, (lc) => lc.comment)
  likesComments: LikeComment[];

  @ManyToOne(() => User, (u) => u.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
