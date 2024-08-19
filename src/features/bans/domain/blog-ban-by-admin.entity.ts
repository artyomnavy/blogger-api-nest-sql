import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Blog } from '../../blogs/domain/blog.entity';

@Entity({ name: 'blogs_bans_by_admin' })
export class BlogBanByAdmin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('boolean', { name: 'is_banned', default: false })
  isBanned: boolean;

  @Column('timestamp with time zone', { name: 'ban_date', nullable: true })
  banDate: Date | null;

  @OneToOne(() => Blog, (b) => b.blogBanByAdmin, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;
}
