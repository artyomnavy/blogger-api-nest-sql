import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';

@Entity({ name: 'devices' })
export class Device {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  deviceId: string;

  @Column()
  iat: Date;

  @Column('timestamp with time zone')
  exp: Date;

  @Column('character varying')
  ip: string;

  @Column({
    name: 'device_name',
    type: 'character varying',
  })
  deviceName: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (u) => u.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
