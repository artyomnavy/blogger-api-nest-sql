import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlayerSession } from '../domain/player-session.entity';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../../users/domain/user.entity';

@Injectable()
export class PlayersSessionsRepository {
  constructor(
    @InjectRepository(PlayerSession)
    private readonly playersSessionsRepository: Repository<PlayerSession>,
  ) {}
  async createPlayerSession(playerSessionData: {
    id: string;
    player: User;
    score: number;
  }): Promise<PlayerSession> {
    const newPlayerSession = new PlayerSession();

    newPlayerSession.id = playerSessionData.id;
    newPlayerSession.player = playerSessionData.player;
    newPlayerSession.score = playerSessionData.score;

    const createPlayerSession =
      await this.playersSessionsRepository.save(newPlayerSession);

    return createPlayerSession;
  }
  async updateScoreForPlayerSession(
    manager: EntityManager,
    playerSession: PlayerSession,
    score: number,
  ): Promise<PlayerSession> {
    playerSession.score = score;

    return await manager.save(playerSession);
  }
}
