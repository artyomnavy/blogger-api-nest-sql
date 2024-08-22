import { DataSource, EntityManager } from 'typeorm';

export abstract class TransactionManagerUseCase<I, O> {
  // Свойство-флаг для отслеживания добавления таймаута
  protected timeoutAdded = false;

  protected constructor(protected readonly dataSource: DataSource) {}

  // Абстрактный метод, который использует реализацию логики конкретного подкласса
  protected abstract doLogic(command: I, manager: EntityManager): Promise<O>;

  // Метод, который вызывается в контроллере commandBus
  public async execute(command: I): Promise<O> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await this.doLogic(command, queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Transaction rollback:', error);
      throw error;
    } finally {
      if (!this.timeoutAdded) {
        await queryRunner.release();
      }
    }
  }
}

// Другой вариант:
// export abstract class TransactionManagerUseCase<I, O> {
//   protected constructor(protected readonly dataSource: DataSource) {}
//
//   protected async runTransaction(
//     currentUseCase: (manager: EntityManager) => Promise<O>,
//   ): Promise<O | null> {
//     const queryRunner = this.dataSource.createQueryRunner();
//     await queryRunner.connect();
//     await queryRunner.startTransaction();
//
//     try {
//       const result = await currentUseCase(queryRunner.manager);
//       await queryRunner.commitTransaction();
//       return result;
//     } catch (error) {
//       await queryRunner.rollbackTransaction();
//       console.log('Transaction rollback: ', error);
//       return null;
//     } finally {
//       await queryRunner.release();
//     }
//   }
// }
