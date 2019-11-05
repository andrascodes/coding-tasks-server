import express, { Response } from "express";
import CryptoJS from "crypto-js";
import { ExpressError } from "../../types/utils";
import { Database, Item } from "../../types/database";
import API_ROUTES from "../../constants/apiRoutes";
import logger from "../../config/winston";
import { ENCRYPTED_ROUTE_ERRORS as ERRORS } from "../../constants/errors";

interface CreateErrorResponseArguments {
  message: string;
  statusCode: number;
  code: string;
}

function sendErrorResponse({ message, statusCode, code }: CreateErrorResponseArguments, res: Response): Response {
  return res.status(statusCode).format({
    json() {
      res.json({ error: message, code });
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
        return sendErrorResponse(ERRORS.missingDecryptionKey, res);
      }

      const { id } = req.params;

      const requestedItems: Item[] = db
        .getItems()
        .filter((post: Item) => {
          if (id === "*") return true;
          return post.id === id;
        })
        .value();

      if (requestedItems.length <= 0) {
        return sendErrorResponse(ERRORS.resourceNotFound, res);
      }

      try {
        const decryptedItems = requestedItems.reduce((acc: Item[], post: Item) => {
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
          decryptedItems.map((post: Item) => ({
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

        const newItem: Item = { id, value: encryptedValue };

        const itemInDb = db
          .getItems()
          .find({ id })
          .value();

        if (!itemInDb) {
          db.getItems()
            .push(newItem)
            .write();
        }

        db.getItems()
          .find({ id })
          .assign(newItem)
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
