import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from '../../../posts/domain/post.entity';

@Entity({ name: 'posts_main_images' })
export class PostMainImage {
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

  @Column({ name: 'image_size', type: 'character varying' })
  imageSize: string;

  @ManyToOne(() => Post, (p) => p.postMainImage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;
}
