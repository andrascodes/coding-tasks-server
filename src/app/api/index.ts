import express, { Response } from "express";
import { ExpressError } from "../../types/utils";
import { Match, Field, MatchResponse, User, Database } from "../../types/database";
import API_ROUTES from "../../constants/apiRoutes";

interface ApiRouterArguments {
  db: Database;
}

export default function createApiRouter({ db }: ApiRouterArguments): express.Router {
  const apiRouter = express.Router();

  apiRouter.get(
    `/${API_ROUTES.healthcheck}`,
    (req, res): Response => {
      return res.status(200).json({
        result: "success",
      });
    },
  );

  apiRouter.get(`/${API_ROUTES.errorcheck}`, (req, res): void => {
    throw new ExpressError(500);
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
        return res.status(404).format({
          // html() {
          //   res.render("404", { url: req.url });
          // },
          json() {
            res.json({ error: "Not found" });
          },
          default() {
            res.type("txt").send("Not found");
          },
        });
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
    async (req, res): Promise<Response> => {
      const authHeader = req.header("Authorization");
      const encodedUsernamePassword = authHeader && authHeader.split("Basic ")[1];

      if (!encodedUsernamePassword) {
        return res.status(400).format({
          // html() {
          //   res.render("400", { url: req.url });
          // },
          json() {
            res.json({ error: "Bad Request" });
          },
          default() {
            res.type("txt").send("Bad Request");
          },
        });
      }

      const usernamePasswordBuffer = Buffer.from(encodedUsernamePassword, "base64");
      const usernamePassword = usernamePasswordBuffer && usernamePasswordBuffer.toString();
      const [username, password] = usernamePassword.split(":");

      if (!username || !password) {
        return res.status(400).format({
          // html() {
          //   res.render("400", { url: req.url });
          // },
          json() {
            res.json({ error: "Bad Request" });
          },
          default() {
            res.type("txt").send("Bad Request");
          },
        });
      }

      const [userExists, passwordsMatch] = await db.authenticateUser({ username, password });

      if (!userExists) {
        const savedUser = await db.createUser({ username, password });

        return res.status(200).json({
          data: {
            id: savedUser.id,
            token: savedUser.password,
          },
        });
      }

      const user = userExists as User;

      if (!passwordsMatch) {
        return res.status(401).format({
          // html() {
          //   res.render("401", { url: req.url });
          // },
          json() {
            res.json({ error: "Incorrect username or password" });
          },
          default() {
            res.type("txt").send("Incorrect username or password");
          },
        });
      }
      return res.status(200).json({
        data: {
          id: user.id,
          token: user.password,
        },
      });
    },
  );

  return apiRouter;
}
