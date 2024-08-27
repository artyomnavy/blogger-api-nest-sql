import { access, rmdir, stat, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export const checkFileExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const deleteEmptyFolders = async (path: string): Promise<boolean> => {
  // Устанавливаем значение по умолчанию о пустоте path
  let isEmpty = true;

  // Читаем содержимое path
  const files = await readdir(path);

  // Проверяем пустой ли path или содержит файлы/папки
  if (files.length > 0) {
    for (const file of files) {
      // Создаем полный путь к файлу или папке
      const fullPath = join(path, file);
      // Получаем информацию, что находится по полному пути - файлы/папки
      const fileStat = await stat(fullPath);

      // Проверяем информацию, что по полному пути находится папка
      if (fileStat.isDirectory()) {
        // Рекурсивно вызываем функцию для этого полного пути
        const isPathEmpty = await deleteEmptyFolders(fullPath);
        // Если подпуть не пуст, то меняем значение о пустоте path
        if (!isPathEmpty) {
          isEmpty = false;
        }
      } else {
        // Если по полному пути находится файл, то меняем значение о пустоте path
        isEmpty = false;
      }
    }
  }

  // Если path пуст, то удаляем его
  if (isEmpty) {
    await rmdir(path);
  }

  return isEmpty;
};
