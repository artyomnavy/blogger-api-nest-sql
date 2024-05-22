import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlayerSession } from '../domain/player-session.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PlayersSessionsQueryRepository {
  constructor(
    @InjectRepository(PlayerSession)
    private readonly playersSessionsQueryRepository: Repository<PlayerSession>,
  ) {}
  async getPlayerSessionById(
    playerSessionId: string,
  ): Promise<PlayerSession | null> {
    const playerSession = await this.playersSessionsQueryRepository.findOneBy({
      id: playerSessionId,
    });

    if (!playerSession) {
      return null;
    } else {
      return playerSession;
    }
  }
}
