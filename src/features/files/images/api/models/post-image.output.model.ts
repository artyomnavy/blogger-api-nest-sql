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

export class PostMainImageModel {
  url: string;
  width: number;
  height: number;
  fileSize: number;
}

export class PostMainImagesOutputModel {
  main: PostMainImageModel[];
}

export const updatePostImagesFsUrlsForOutput = (
  protocol: string,
  host: string,
  postMainImages: PostMainImageModel[],
): PostMainImagesOutputModel => {
  return {
    main: [
      ...postMainImages.map((mainImage) => ({
        ...mainImage,
        url: `${protocol}://${host}/${mainImage.url}`,
      })),
    ],
  };
};

export const updatePostImagesS3UrlsForOutput = (
  postMainImages: PostMainImageModel[],
): PostMainImagesOutputModel => {
  return {
    main: [
      ...postMainImages.map((mainImage) => ({
        ...mainImage,
        url: `${process.env.S3_BUCKET_ENDPOINT}/${mainImage.url}`,
      })),
    ],
  };
};
