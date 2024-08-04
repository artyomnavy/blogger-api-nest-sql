import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Blog } from '../../blogs/domain/blog.entity';
import { LikePost } from '../../likes/domain/like-post.entity';
import { Comment } from '../../comments/domain/comment.entity';

@Entity({ name: 'posts' })
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'character varying',
    length: 30,
    collation: 'C',
  })
  title: string;

  @Column({
    name: 'short_description',
    type: 'character varying',
    length: 100,
    collation: 'C',
  })
  shortDescription: string;

  @Column({
    type: 'character varying',
    length: 1000,
    collation: 'C',
  })
  content: string;

  @Column({ name: 'blog_id', type: 'uuid' })
  blogId: string;

  @Column('timestamp with time zone', { name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => LikePost, (lp) => lp.post)
  likesPosts: LikePost[];

  @ManyToOne(() => Blog, (b) => b.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;

  @OneToMany(() => Comment, (c) => c.post)
  comments: Comment[];
}
