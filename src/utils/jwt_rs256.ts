export const generateAccessToken = (payload: object): string => {
  throw new Error('RS256 JWT signing is not supported in this mock implementation.');
};

export const generateRefreshToken = (payload: object): string => {
  throw new Error('RS256 JWT signing is not supported in this mock implementation.');
};

export const verifyToken = (token: string): object | string => {
  throw new Error('RS256 JWT verification is not supported in this mock implementation.');
};
