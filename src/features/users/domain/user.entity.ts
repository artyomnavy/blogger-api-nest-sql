import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Device } from '../../devices/domain/device.entity';

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

  // @OneToMany(() => Comments, (c) => c.userId)
  // comments: ;
  //
  // @OneToMany(() => LikesPosts, (lp) => lp.userId)
  // likesPosts: ;
  //
  // @OneToMany(() => LikesComments, (lc) => lc.userId)
  // likesComments: ;
}
