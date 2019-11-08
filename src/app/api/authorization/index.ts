import { Response, NextFunction, Request, RequestHandler } from "express";
import { Database } from "../../../types/database";
import sendErrorResponse from "../../utils/sendErrorResponse";
import ERRORS from "../../../constants/errors";

export default function createAuthorizationMiddleware(db: Database): RequestHandler {
  return async function authorizationMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      sendErrorResponse(ERRORS.missingToken, res);
      return;
    }

    const tokenString = authHeader.includes("Bearer") ? authHeader.substring(7) : authHeader;

    try {
      const { id, username, token } = await db.authorizeUser(tokenString);
      res.locals.user = {
        id,
        username,
        token,
      };
      next();
      return;
    } catch (error) {
      sendErrorResponse(ERRORS.invalidToken, res);
    }
  };
}
