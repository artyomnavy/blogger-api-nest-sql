import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { Post } from '../../posts/domain/post.entity';

@Entity({ name: 'likes_posts' })
export class LikePost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id', type: 'uuid' })
  postId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column('character varying')
  status: string;

  @Column('timestamp with time zone', { name: 'added_at' })
  addedAt: Date;

  @ManyToOne(() => Post, (p) => p.likesPosts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => User, (u) => u.likesPosts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
