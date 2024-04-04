import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Blog } from '../../blogs/domain/blog.entity';

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

  @ManyToOne(() => Blog, (b) => b.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;
}
