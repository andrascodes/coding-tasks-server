import express, { Response } from "express";
import CryptoJS from "crypto-js";
import { ExpressError } from "../../types/utils";
import { Database, Item } from "../../types/database";
import API_ROUTES from "../../constants/apiRoutes";
import logger from "../../config/winston";
import ERRORS from "../../constants/errors";
import sendErrorResponse from "../utils/sendErrorResponse";

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

  encryptedRouter.get(`/${API_ROUTES.errorcheck}`, (req, res, next): void => {
    next(new ExpressError(500));
  });

  encryptedRouter.get(
    "/items/:id",
    async (req, res, next): Promise<void> => {
      const decryptionKey = req.header("Authorization");

      if (!decryptionKey) {
        sendErrorResponse(ERRORS.missingDecryptionKey, res);
        return;
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
        sendErrorResponse(ERRORS.resourceNotFound, res);
        return;
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

        res.status(200).json(
          decryptedItems.map((post: Item) => ({
            id: post.id,
            value: JSON.parse(post.value),
          })),
        );
        return;
      } catch (error) {
        logger.error(error);
        next(error);
      }
    },
  );

  encryptedRouter.post(
    "/items/:id",
    async (req, res, next): Promise<void> => {
      const encryptionKey = req.header("Authorization");

      if (!encryptionKey) {
        sendErrorResponse(ERRORS.missingEncryptionKey, res);
        return;
      }

      const { id } = req.params;
      const { value } = req.body;

      if (!value) {
        sendErrorResponse(ERRORS.wrongRequestBody, res);
        return;
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

        res.status(200).json({
          id,
          result: "success",
        });
        return;
      } catch (error) {
        logger.error(error);
        next(error);
      }
    },
  );

  return encryptedRouter;
}
