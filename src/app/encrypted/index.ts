import express, { Response } from "express";
import CryptoJS from "crypto-js";
import { ExpressError } from "../../types/utils";
import { Database, Post } from "../../types/database";
import API_ROUTES from "../../constants/apiRoutes";
import logger from "../../config/winston";

const ERRORS = {
  wrongDecryptionKey: { message: "Please specify the decryption key in the Authorization header!", code: 401 },
  wrongRequestBody: { message: "Please specify the value property on the request body!", code: 400 },
  missingEncryptionKey: { message: "Please specify the encryption key in the Authorization header!", code: 401 },
  resourceNotFound: { message: "Resource with the specified 'id' was not found.", code: 404 },
};

interface CreateErrorResponseArguments {
  message: string;
  code: number;
}

function sendErrorResponse({ message, code }: CreateErrorResponseArguments, res: Response): Response {
  return res.status(code).format({
    json() {
      res.json({ error: message });
    },
    default() {
      res.type("txt").send(message);
    },
  });
}

interface ApiRouterArguments {
  db: Database;
}

export default function createEncryptedRouter({ db }: ApiRouterArguments): express.Router {
  const encryptedRouter = express.Router();

  encryptedRouter.get(
    `/${API_ROUTES.healthcheck}`,
    (_, res): Response => {
      return res.status(200).json({
        result: "success",
      });
    },
  );

  encryptedRouter.get(`/${API_ROUTES.errorcheck}`, (): void => {
    throw new ExpressError(500);
  });

  encryptedRouter.get(
    "/items/:id",
    async (req, res): Promise<Response> => {
      const decryptionKey = req.header("Authorization");

      if (!decryptionKey) {
        return sendErrorResponse(ERRORS.wrongDecryptionKey, res);
      }

      const { id } = req.params;

      const requestedPosts: Post[] = db
        .getPosts()
        .filter((post: Post) => {
          if (id === "*") return true;
          return post.id === id;
        })
        .value();

      if (requestedPosts.length <= 0) {
        return sendErrorResponse(ERRORS.resourceNotFound, res);
      }

      try {
        const decryptedPosts = requestedPosts.reduce((acc: Post[], post: Post) => {
          const decryptedValue = CryptoJS.AES.decrypt(post.value, decryptionKey).toString(CryptoJS.enc.Utf8);
          if (decryptedValue.length <= 0) {
            logger.error(`Failed to decrypt resource with id: "${post.id}", using the key: "${decryptionKey}"`);
            return acc;
          }
          acc.push({
            id: post.id,
            value: decryptedValue,
          });
          return acc;
        }, []);

        return res.status(200).json(
          decryptedPosts.map((post: Post) => ({
            id: post.id,
            value: JSON.parse(post.value),
          })),
        );
      } catch (error) {
        logger.error(error);
        throw error;
      }
    },
  );

  encryptedRouter.post(
    "/items/:id",
    async (req, res): Promise<Response> => {
      const encryptionKey = req.header("Authorization");

      if (!encryptionKey) {
        return sendErrorResponse(ERRORS.missingEncryptionKey, res);
      }

      const { id } = req.params;
      const { value } = req.body;

      if (!value) {
        return sendErrorResponse(ERRORS.wrongRequestBody, res);
      }

      try {
        const encryptedValue = CryptoJS.AES.encrypt(JSON.stringify(value), encryptionKey).toString();

        const newPost: Post = { id, value: encryptedValue };

        const postInDb = db
          .getPosts()
          .find({ id })
          .value();

        if (!postInDb) {
          db.getPosts()
            .push(newPost)
            .write();
        }

        db.getPosts()
          .find({ id })
          .assign(newPost)
          .write();

        return res.status(200).json({
          id,
          result: "success",
        });
      } catch (error) {
        logger.error(error);
        throw error;
      }
    },
  );

  return encryptedRouter;
}
