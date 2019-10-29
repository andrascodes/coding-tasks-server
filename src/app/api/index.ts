import express from "express";
import * as lowdb from "lowdb";
import { ExpressError } from "../../types/utils";
import { Match, Field, MatchResponse } from "../../types/database";
import API_ROUTES from "../../constants/apiRoutes";

interface ApiRouterArguments {
  db: lowdb.LowdbAsync<any> | lowdb.LowdbSync<any>;
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
      const eventsDbObject: any = db.get(API_ROUTES.events);

      const events: Match[] = eventsDbObject.filter((event: Match) => event.start * 1000 >= Date.now()).value();
      const fields: Field[] = db.get(API_ROUTES.fields).value();

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

      const eventsDbObject: any = db.get(API_ROUTES.events);
      const event: Match = eventsDbObject.find((eventObj: Match) => `${eventObj.id}` === `${id}`).value();

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
      const fields: Field[] = db.get(API_ROUTES.fields).value();

      const { fieldId, ...restOfEvent } = event;
      const data: MatchResponse = {
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

      const fields: Field[] = db.get(API_ROUTES.fields).value();

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

  return apiRouter;
}
