export class BlogWallpaper {
  constructor(
    public id: string,
    public url: string,
    public width: number,
    public height: number,
    public fileSize: number,
  ) {}
}

export class BlogWallpaperOutputModel {
  url: string;
  width: number;
  height: number;
  fileSize: number;
}

export class BlogMainImageOutputModel {
  url: string;
  width: number;
  height: number;
  fileSize: number;
}

export class BlogImagesOutputModel {
  wallpaper: BlogWallpaperOutputModel;
  main: BlogMainImageOutputModel[];
}
