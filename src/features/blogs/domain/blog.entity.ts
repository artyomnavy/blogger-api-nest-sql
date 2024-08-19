import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from '../../posts/domain/post.entity';
import { User } from '../../users/domain/user.entity';
import { BlogBanByAdmin } from '../../bans/domain/blog-ban-by-admin.entity';
import { BlogWallpaper } from '../../images/domain/wallpaper-blog.entity';
import { BlogMainImage } from '../../images/domain/main-image-blog.entity';

@Entity({ name: 'blogs' })
export class Blog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'character varying',
    length: 15,
    collation: 'C',
  })
  name: string;

  @Column({
    type: 'character varying',
    length: 500,
    collation: 'C',
  })
  description: string;

  @Column({
    name: 'website_url',
    type: 'character varying',
    length: 100,
    collation: 'C',
  })
  websiteUrl: string;

  @Column('timestamp with time zone', { name: 'created_at' })
  createdAt: Date;

  @Column('boolean', { name: 'is_membership', default: false })
  isMembership: boolean;

  @OneToOne(() => BlogBanByAdmin, (bba) => bba.blog)
  @JoinColumn({ name: 'blog_ban_by_admin_id' })
  blogBanByAdmin: BlogBanByAdmin;

  @OneToMany(() => Post, (p) => p.blog)
  posts: Post[];

  @ManyToOne(() => User, (u) => u.blogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => BlogWallpaper, (bw) => bw.blog)
  @JoinColumn({ name: 'blog_wallpaper_id' })
  blogWallpaper: BlogWallpaper;

  @OneToOne(() => BlogMainImage, (bmi) => bmi.blog)
  @JoinColumn({ name: 'blog_main_image_id' })
  blogMainImage: BlogMainImage;
}
