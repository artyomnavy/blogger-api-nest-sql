import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from '../../posts/domain/post.entity';

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

  @Column({ name: 'image_size', type: 'int' })
  imageSize: string;

  @OneToOne(() => Post, (p) => p.postMainImage, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'post_id' })
  post: Post;
}
