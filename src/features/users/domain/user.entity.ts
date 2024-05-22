import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Device } from '../../devices/domain/device.entity';
import { Comment } from '../../comments/domain/comment.entity';
import { LikeComment } from '../../likes/domain/like-comment.entity';
import { LikePost } from '../../likes/domain/like-post.entity';
import { Blog } from '../../blogs/domain/blog.entity';
import { PlayerSession } from '../../quiz/domain/player-session.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'character varying',
    length: 10,
    unique: true,
    collation: 'C',
  })
  login: string;

  @Column({ type: 'character varying' })
  password: string;

  @Column({ type: 'character varying', unique: true, collation: 'C' })
  email: string;

  @Column('timestamp with time zone', { name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'confirmation_code',
    type: 'character varying',
    nullable: true,
  })
  confirmationCode: string | null;

  @Column('timestamp with time zone', {
    name: 'expiration_date',
    nullable: true,
  })
  expirationDate: Date | null;

  @Column('boolean', { name: 'is_confirmed', default: false })
  isConfirmed: boolean;

  @OneToMany(() => Device, (d) => d.user)
  devices: Device[];

  @OneToMany(() => Blog, (blog) => blog.user)
  blogs: Blog[];

  @OneToMany(() => Comment, (c) => c.user)
  comments: Comment[];

  @OneToMany(() => LikePost, (lp) => lp.user)
  likesPosts: LikePost[];

  @OneToMany(() => LikeComment, (lc) => lc.user)
  likesComments: LikeComment[];

  @OneToMany(() => PlayerSession, (ps) => ps.player)
  playersSessions: PlayerSession[];
}
