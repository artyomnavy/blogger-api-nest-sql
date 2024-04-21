import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'BloggerPlatform',
  synchronize: false,
  migrations: ['migrations/*.ts'],
  entities: ['src/**/*.entity.ts'],
});
