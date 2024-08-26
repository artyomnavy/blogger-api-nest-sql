import { readFile, writeFile } from 'node:fs';
import { promises as fsPromises } from 'node:fs';
import { join, dirname } from 'node:path';
import { unlink } from 'node:fs/promises';

// relativePath - относительный путь до файла

export const readFileAsync = (relativePath: string) => {
  return new Promise<Buffer>((resolve, reject) => {
    // Получение корневого модуля, с которого было начато выполнение приложения
    const mainFile = require.main;

    if (!mainFile) {
      // Скрипт не был запущен напрямую
      return reject(new Error('require.main is undefined'));
    }

    // Получение корневого пути приложения
    const rootDirPath = dirname(mainFile.filename);

    // Формирование абсолютного пути к файлу
    const filePath = join(rootDirPath, relativePath);

    // Чтение файла по указанному абсолютному пути
    readFile(filePath, (error, data) => {
      if (error) {
        console.error(error);
        reject(error);
      }

      resolve(data);
    });
  });
};

export const saveFileAsync = (relativePath: string, data: Buffer) => {
  return new Promise<void>((resolve, reject) => {
    // Получение корневого модуля, с которого было начато выполнение приложения
    const mainFile = require.main;

    if (!mainFile) {
      // Скрипт не был запущен напрямую
      return reject(new Error('require.main is undefined'));
    }

    // Получение корневого пути приложения
    const rootDirPath = dirname(mainFile.filename);

    // Формирование абсолютного пути к файлу
    const filePath = join(rootDirPath, relativePath);

    // Запись файла по указанному абсолютному пути
    writeFile(filePath, data, (error) => {
      if (error) {
        console.error(error);
        reject(error);
      }
      resolve();
    });
  });
};

export const deleteFileAsync = async (relativePath: string): Promise<void> => {
  // Получение корневого модуля, с которого было начато выполнение приложения
  const mainFile = require.main;

  if (!mainFile) {
    // Скрипт не был запущен напрямую
    throw new Error('require.main is undefined');
  }

  // Получение корневого пути приложения
  const rootDirPath = dirname(mainFile.filename);

  // Формирование абсолютного пути к файлу
  const filePath = join(rootDirPath, relativePath);

  // Удаление файла по указанному абсолютному пути
  try {
    await unlink(filePath);
  } catch (error) {
    console.error(error);
  }
};

export const ensureDirAsync = async (relativePath: string): Promise<void> => {
  // Получение корневого модуля, с которого было начато выполнение приложения
  const mainFile = require.main;

  if (!mainFile) {
    // Скрипт не был запущен напрямую
    throw new Error('require.main is undefined');
  }

  // Получение корневого пути приложения
  const rootDirPath = dirname(mainFile.filename);

  // Формирование абсолютного пути к файлу
  const dirPath = join(rootDirPath, relativePath);

  try {
    // Создание директории ({ recursive: true } - создает все необходимые поддиректории)
    await fsPromises.mkdir(dirPath, { recursive: true });
  } catch (errorMkDir) {
    console.error(errorMkDir);
  }
};
