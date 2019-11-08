import express, { Response } from "express";
import rateLimit from "express-rate-limit";
import fetch from "node-fetch";
import { ExpressError } from "../../types/utils";
import { Match, Field, MatchResponse, User, Database } from "../../types/database";
import API_ROUTES from "../../constants/apiRoutes";
import sendErrorResponse from "../utils/sendErrorResponse";
import ERRORS from "../../constants/errors";
import createAuthorizationMiddleware from "./authorization";
import { countriesApiUrl, exchangeRateApiUrl } from "../../config";
import createCountriesApi, { CountrySearchItem } from "../../lib/countriesApi";
import createExchangeRateApi from "../../lib/exchangeRateApi";

interface ApiRouterArguments {
  db: Database;
}

export default function createApiRouter({ db }: ApiRouterArguments): express.Router {
  const countriesApi = createCountriesApi({ apiUrl: countriesApiUrl, fetch });
  const exchangeRateApi = createExchangeRateApi({ apiUrl: exchangeRateApiUrl, fetch });

  const apiRouter = express.Router();

  apiRouter.get(
    `/${API_ROUTES.healthcheck}`,
    (req, res): Response => {
      return res.status(200).json({
        result: "success",
      });
    },
  );

  apiRouter.get(`/${API_ROUTES.errorcheck}`, (req, res, next): void => {
    next(new ExpressError(500));
  });

  apiRouter.get(
    `/${API_ROUTES.events}`,
    (req, res): Response => {
      const events: Match[] = db
        .getEvents()
        .filter((event: Match) => event.start * 1000 >= Date.now())
        .value();
      const fields: Field[] = db.getFields().value();

      const data: MatchResponse[] = events.map((event: Match) => {
        const { fieldId, ...restOfEvent } = event;
        return {
          ...restOfEvent,
          field: fields.find((field: Field) => field.id === fieldId) || {
            id: 2,
            name: "Långholmens bollplan",
            address: {
              street: "Alstaviksvägen 9",
              city: "Stockholm",
              zipcode: "117 33",
              country: "Sweden",
              location: {
                lat: 59.320351,
                lng: 18.02859,
              },
            },
          },
        };
      });

      return res.status(200).json({
        data,
      });
    },
  );

  apiRouter.get(
    `/${API_ROUTES.events}/:id`,
    (req, res): Response => {
      const { id } = req.params;

      const event: Match = db
        .getEvents()
        .find((eventObj: Match) => `${eventObj.id}` === `${id}`)
        .value();

      if (!event) {
        return sendErrorResponse(ERRORS.resourceNotFound, res);
      }
      const fields: Field[] = db.getFields().value();

      const { fieldId, ...restOfEvent } = event;
      const data: MatchResponse = {
        ...restOfEvent,
        // When using proper database, the field will be specified,
        // so there is no need to return a default field e.g.: { id:2 ...}
        field: fields.find((field: Field) => field.id === fieldId) || {
          id: 2,
          name: "Långholmens bollplan",
          address: {
            street: "Alstaviksvägen 9",
            city: "Stockholm",
            zipcode: "117 33",
            country: "Sweden",
            location: {
              lat: 59.320351,
              lng: 18.02859,
            },
          },
        },
      };

      return res.status(200).json({
        data,
      });
    },
  );

  apiRouter.get(
    `/${API_ROUTES.fields}`,
    (req, res): Response => {
      const searchString =
        req.query.search && req.query.search.includes('"') ? req.query.search.split('"')[1] : req.query.search;

      const fields: Field[] = db.getFields().value();

      if (!searchString) {
        return res.status(200).json({
          data: fields,
        });
      }

      return res.status(200).json({
        data: fields.filter(field => {
          const fieldString = `${field.name}, ${field.address.street}, ${field.address.zipcode} ${field.address.city}, ${field.address.country}`;
          return fieldString
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .includes(searchString.toUpperCase());
        }),
      });
    },
  );

  apiRouter.post(
    `/${API_ROUTES.login}`,
    async (req, res, next): Promise<void> => {
      const clientId = req.header("Client-Id");
      if (!clientId) {
        sendErrorResponse(ERRORS.missingClientId, res);
        return;
      }

      const authHeader = req.header("Authorization");
      const encodedUsernamePassword = authHeader && authHeader.split("Basic ")[1];

      if (!encodedUsernamePassword) {
        sendErrorResponse(ERRORS.wrongLoginRequest, res);
        return;
      }

      try {
        const usernamePasswordBuffer = Buffer.from(encodedUsernamePassword, "base64");
        const usernamePassword = usernamePasswordBuffer && usernamePasswordBuffer.toString();
        const [username, password] = usernamePassword.split(":");

        if (!username || !password) {
          sendErrorResponse(ERRORS.wrongLoginRequest, res);
          return;
        }

        const [userExists, passwordsMatch] = await db.authenticateUser({ username, password });

        if (!userExists) {
          const savedUser = await db.createUser({ username, password });
          const token = await db.createToken(savedUser, clientId);

          res
            .status(200)
            .header("Authorization", token)
            .json({
              data: {
                id: savedUser.id,
                username: savedUser.username,
              },
            });
          return;
        }

        const user = userExists as User;

        if (!passwordsMatch) {
          sendErrorResponse(ERRORS.incorrectLogin, res);
          return;
        }

        const token = await db.createToken(user, clientId);

        res
          .status(200)
          .header("Authorization", token)
          .json({
            data: {
              id: user.id,
              username: user.username,
            },
          });
        return;
      } catch (error) {
        next(error);
      }
    },
  );

  const createCountriesLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Block after 30 requests
    keyGenerator(req, res) {
      // per Token
      return res.locals.user.token;
    },
    handler(req, res) {
      sendErrorResponse(ERRORS.limitReached, res);
    },
  });

  apiRouter.get(
    `/country`,
    createAuthorizationMiddleware(db),
    async (req, res, next): Promise<void> => {
      try {
        const searchString =
          req.query.search && req.query.search.includes('"') ? req.query.search.split('"')[1] : req.query.search;

        if (!searchString) {
          sendErrorResponse(ERRORS.wrongSearchRequest, res);
          return;
        }

        const result = await countriesApi.search(searchString);

        res.status(200).json({
          result,
        });
        return;
      } catch (error) {
        next(error);
      }
    },
  );

  apiRouter.get(
    `/country/:code`,
    createAuthorizationMiddleware(db),
    createCountriesLimiter,
    async (req, res, next): Promise<void> => {
      const { code: countryCode } = req.params;

      try {
        const result = await countriesApi.getByCode(countryCode);
        if (!result) {
          sendErrorResponse(ERRORS.resourceNotFound, res);
          return;
        }

        const currencyBase = "SEK";
        const rates = await exchangeRateApi.latest(result.currencies.map(({ code }) => code), "SEK");
        res.status(200).json({
          result: {
            ...result,
            currencies: result.currencies.map(({ code, name, symbol }) => ({
              code,
              name,
              symbol,
              base: currencyBase,
              rate: rates[code],
            })),
          },
        });
        return;
      } catch (error) {
        next(error);
      }
    },
  );

  return apiRouter;
}
