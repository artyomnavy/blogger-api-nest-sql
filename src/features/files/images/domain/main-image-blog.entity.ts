import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Blog } from '../../../blogs/domain/blog.entity';

@Entity({ name: 'blogs_main_images' })
export class BlogMainImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'character varying' })
  url: string;

  @Column({ type: 'int' })
  width: number;

  @Column({ type: 'int' })
  height: number;

  @Column({ name: 'file_size', type: 'int' })
  fileSize: number;

  @ManyToOne(() => Blog, (b) => b.blogMainImage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;
}
