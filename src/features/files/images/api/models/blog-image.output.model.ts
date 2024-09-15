export class BlogWallpaper {
  constructor(
    public id: string,
    public url: string,
    public width: number,
    public height: number,
    public fileSize: number,
  ) {}
}

export class BlogMainImage {
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
  wallpaper: BlogWallpaperOutputModel | null;
  main: BlogMainImageOutputModel[];
}

export const updateBlogImagesFsUrlsForOutput = (
  protocol: string,
  host: string,
  blogImages: BlogImagesOutputModel,
): BlogImagesOutputModel => {
  return {
    ...blogImages,
    wallpaper: blogImages.wallpaper
      ? {
          ...blogImages.wallpaper,
          url: `${protocol}://${host}/${blogImages.wallpaper.url}`,
        }
      : null,
    main: blogImages.main.map((mainImage) => ({
      ...mainImage,
      url: `${protocol}://${host}/${mainImage.url}`,
    })),
  };
};

export const updateBlogImagesS3UrlsForOutput = (
  blogImages: BlogImagesOutputModel,
): BlogImagesOutputModel => {
  return {
    ...blogImages,
    wallpaper: blogImages.wallpaper
      ? {
          ...blogImages.wallpaper,
          url: `${process.env.S3_BUCKET_ENDPOINT}/${blogImages.wallpaper.url}`,
        }
      : null,
    main: blogImages.main.map((mainImage) => ({
      ...mainImage,
      url: `${process.env.S3_BUCKET_ENDPOINT}/${mainImage.url}`,
    })),
  };
};
