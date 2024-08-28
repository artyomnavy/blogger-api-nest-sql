export class PostMainImage {
  constructor(
    public id: string,
    public url: string,
    public width: number,
    public height: number,
    public fileSize: number,
    public imageSize: string,
  ) {}
}

export class PostMainImageOutputModel {
  url: string;
  width: number;
  height: number;
  fileSize: number;
}
