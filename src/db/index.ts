import lowdb from "lowdb";
import Memory from "lowdb/adapters/Memory";
import FileAsync from "lowdb/adapters/FileAsync";
import FIELDS from "./fields";
import EVENTS from "./events";
import API_ROUTES from "../constants/apiRoutes";
import { Database } from "../types/database";

function createResponse(db: any): Database {
  return {
    getEvents(): any {
      const eventsDbObject: any = db.get(API_ROUTES.events);
      return eventsDbObject;
    },
    setEvents(value): any {
      return db.set(API_ROUTES.events, value);
    },
    getFields(): any {
      const fieldsDbObject: any = db.get(API_ROUTES.fields);
      return fieldsDbObject;
    },
    setFields(value): any {
      return db.set(API_ROUTES.fields, value);
    },
    getUsers(): any {
      const usersDbObject: any = db.get(API_ROUTES.users);
      return usersDbObject;
    },
    getRSVPs(): any {
      const rsvpDbObject: any = db.get(API_ROUTES.rsvps);
      return rsvpDbObject;
    },
  };
}

export default async function createDB(options = { test: false }): Promise<Database> {
  if (options.test) {
    const adapter = new Memory("");
    const db = lowdb(adapter);

    db.defaults({
      [`${API_ROUTES.events}`]: [],
      [`${API_ROUTES.fields}`]: [],
      [`${API_ROUTES.users}`]: [],
      [`${API_ROUTES.rsvps}`]: [],
    }).write();
    return createResponse(db);
  }
  const adapter = new FileAsync("./db.json");
  const db = await lowdb(adapter);

  db.defaults({
    [`${API_ROUTES.events}`]: EVENTS,
    [`${API_ROUTES.fields}`]: FIELDS,
    [`${API_ROUTES.users}`]: [],
    [`${API_ROUTES.rsvps}`]: [],
  }).write();
  return createResponse(db);
}
