import { JWT_SIGNING_ALGORITHM } from '../config/env';
import * as jwtHs256 from './jwt_hs256';

let jwtModule: typeof jwtHs256;

jwtModule = jwtHs256;

export const generateAccessToken = jwtModule.generateAccessToken;
export const generateRefreshToken = jwtModule.generateRefreshToken;
export const verifyToken = jwtModule.verifyToken;