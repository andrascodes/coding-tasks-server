import express from "express";
import * as lowdb from "lowdb";
import { ExpressError } from "../../types/utils";
import { Match, Field, MatchResponse } from "../../types/database";

interface ApiRouterArguments {
  db: lowdb.LowdbAsync<any> | lowdb.LowdbSync<any>;
}

export default function createApiRouter({ db }: ApiRouterArguments): express.Router {
  const apiRouter = express.Router();

  apiRouter.get("/healthcheck", (req, res): void => {
    res.status(200).json({
      result: "success",
    });
  });

  apiRouter.get("/errorcheck", (req, res): void => {
    throw new ExpressError(500);
  });

  apiRouter.get("/events", (req, res): void => {
    const eventsDbObject: any = db.get("events");

    const events: Match[] = eventsDbObject.filter((event: Match) => event.start * 1000 >= Date.now()).value();
    const fields: Field[] = db.get("fields").value();

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

    res.status(200).json({
      data,
    });
  });

  apiRouter.get("/events/:id", (req, res): void => {
    const { id } = req.params;

    const eventsDbObject: any = db.get("events");
    const event: Match = eventsDbObject.find((eventObj: Match) => `${eventObj.id}` === `${id}`).value();

    if (!event) {
      res.status(404);

      res.format({
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
    } else {
      const fields: Field[] = db.get("fields").value();

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

      res.status(200).json({
        data,
      });
    }
  });

  apiRouter.get("/fields", (req, res): void => {
    const searchString = req.query.search && req.query.search.split('"')[1];

    const fields: Field[] = db.get("fields").value();

    if (!searchString) {
      res.status(200).json({
        data: fields,
      });
    } else {
      res.status(200).json({
        data: fields.filter(field => {
          const fieldString = `${field.name}, ${field.address.street}, ${field.address.zipcode} ${field.address.city}, ${field.address.country}`;
          return fieldString
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .includes(searchString.toUpperCase());
        }),
      });
    }
  });

  return apiRouter;
}
