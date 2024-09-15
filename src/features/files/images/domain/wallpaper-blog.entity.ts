import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Blog } from '../../../blogs/domain/blog.entity';

@Entity({ name: 'blogs_wallpapers' })
export class BlogWallpaper {
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

  @OneToOne(() => Blog, (b) => b.blogWallpaper, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;
}
