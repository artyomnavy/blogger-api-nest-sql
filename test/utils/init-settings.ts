import request from 'supertest';
import { Paths } from './test-constants';
import { HTTP_STATUSES } from '../../src/common/utils';
import { CreateEntitiesTestManager } from './test-manager';
import { AppModule } from '../../src/app.module';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { appSettings } from '../../src/app.settings';

// TestingModuleBuilder: Это класс, который используется для создания и настройки TestingModule.
// Он предоставляет методы для изменения модуля перед его компиляцией, такие как overrideProvider,
// overrideGuard, overrideInterceptor и другие.
// С помощью TestingModuleBuilder можно настроить моки, добавить или заменить провайдеры,
// импортировать другие модули и так далее, чтобы подготовить тестовую среду.

// TestingModule: Это результат компиляции TestingModuleBuilder.
// После вызова метода compile на экземпляре TestingModuleBuilder получаем скомпилированный TestingModule,
// который является экземпляром NestModule.
// В TestingModule уже применены все настройки и изменения, и он готов к использованию в тестах.
// Можно извлекать сервисы, контроллеры и провайдеры из TestingModule для тестирования их поведения.

// TestingModuleBuilder - это инструмент для настройки тестового окружения,
// а TestingModule - это окончательный продукт этой настройки, который используется
// непосредственно в тестах

export const initSettings = async (
  addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
) => {
  // Создаем новый экземпляр TestingModuleBuilder, импортируя AppModule.
  // Это конфигурация тестового модуля по умолчанию
  const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });

  // При выполнении условия позволяет применить дополнительные настройки к тестовому модулю.
  // (если были переданы в initSettings)
  if (addSettingsToModuleBuilder) {
    addSettingsToModuleBuilder(testingModuleBuilder);
  }

  //Компилируем тестовый модуль (создаем экземпляр TestingModule) для тестирования
  const testingModule = await testingModuleBuilder.compile();

  // Создаем экземпляр приложения Nest из тестового модуля
  const app = testingModule.createNestApplication();

  // Применяем настройки к приложению (global pipes & etc)
  appSettings(app);

  // Инициализируем приложение, чтобы оно было готово к запуску
  await app.init();

  // Получаем http-сервер, который будет использоваться для тестирования
  const server = app.getHttpServer();

  // Создаем экземпляр 'CreateEntitiesTestManager', который будет использоваться для тестирования
  const createEntitiesTestManager = new CreateEntitiesTestManager(app);

  // Очищаем базу данных перед запуском тестов, чтобы обеспечить изолированную тестовую среду
  await request(server)
    .delete(`${Paths.testing}/all-data`)
    .expect(HTTP_STATUSES.NO_CONTENT_204);

  // Возвращаем объект с экземпляром приложения, сервером и менеджером сущностей для использования в тестах
  return {
    app,
    server,
    createEntitiesTestManager,
  };
};
