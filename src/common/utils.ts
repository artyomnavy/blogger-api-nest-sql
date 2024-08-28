export const HTTP_STATUSES = {
  OK_200: 200,
  CREATED_201: 201,
  NO_CONTENT_204: 204,

  BAD_REQUEST_400: 400,
  UNAUTHORIZED_401: 401,
  FORBIDDEN_403: 403,
  NOT_FOUND_404: 404,
  IM_A_TEAPOT_418: 418,
  TOO_MANY_REQUESTS_429: 429,
};

type HttpStatusKeys = keyof typeof HTTP_STATUSES;

export type HttpStatusType = (typeof HTTP_STATUSES)[HttpStatusKeys];

export enum LikeStatuses {
  NONE = 'None',
  LIKE = 'Like',
  DISLIKE = 'Dislike',
}

export enum AnswerStatuses {
  CORRECT = 'Correct',
  INCORRECT = 'Incorrect',
}

export enum QuizStatuses {
  PENDING_SECOND_PLAYER = 'PendingSecondPlayer',
  ACTIVE = 'Active',
  FINISHED = 'Finished',
}

export enum PublishedStatuses {
  ALL = 'all',
  PUBLISHED = 'published',
  NOT_PUBLISHED = 'notPublished',
}

export enum BanStatus {
  ALL = 'all',
  BANNED = 'banned',
  NOT_BANNED = 'notBanned',
}

export enum PostMainImageSize {
  ORIGINAL = 'original',
  MIDDLE = 'middle',
  SMALL = 'small',
}

export enum ResultCode {
  SUCCESS,
  FORBIDDEN,
  NOT_FOUND,
  BAD_REQUEST,
  IM_A_TEAPOT,
}
