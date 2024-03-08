import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';

@Injectable()
export class UuidPipe implements PipeTransform {
  transform(id: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(id) === false) {
      throw new NotFoundException('Invalid id pattern');
    }

    return id;
  }
}
