import lowdb from "lowdb";
import Memory from "lowdb/adapters/Memory";
import FileAsync from "lowdb/adapters/FileAsync";
import bcrypt from "bcrypt";
import shortid from "shortid";
import FIELDS from "./fields";
import EVENTS from "./events";
import API_ROUTES from "../constants/apiRoutes";
import { Database, User, AuthInput } from "../types/database";

function createResponse(db: any): Database {
  function getUsers(): any {
    const usersDbObject: any = db.get(API_ROUTES.users);
    return usersDbObject;
  }

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
    getUsers,
    setUsers(value): any {
      return db.set(API_ROUTES.users, value);
    },
    getRSVPs(): any {
      const rsvpDbObject: any = db.get(API_ROUTES.rsvps);
      return rsvpDbObject;
    },
    getPosts(): any {
      const postsDbObject: any = db.get(API_ROUTES.posts);
      return postsDbObject;
    },
    async createUser({ username, password }: AuthInput): Promise<User> {
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        id: shortid.generate(),
        username,
        password: hashedPassword,
      };

      getUsers()
        .push(newUser)
        .write();

      const savedUser = getUsers()
        .find((userObj: User) => userObj.id === newUser.id)
        .value();

      return savedUser;
    },
    async authenticateUser({ username, password }: AuthInput): Promise<[boolean | User, boolean]> {
      const user: User = getUsers()
        .find((userObj: User) => userObj.username === username)
        .value();
      if (!user) return [false, false];

      const passwordsMatch = await bcrypt.compare(password, user.password);
      if (!passwordsMatch) return [true, false];

      return [user, true];
    },
  };
}

export default async function createDB(options = { test: false }): Promise<Database> {
  const INTITIAL_DB_STATE = {
    [`${API_ROUTES.events}`]: [],
    [`${API_ROUTES.fields}`]: [],
    [`${API_ROUTES.users}`]: [],
    [`${API_ROUTES.rsvps}`]: [],
    [`${API_ROUTES.posts}`]: [],
  };

  if (options.test) {
    const adapter = new Memory("");
    const db = lowdb(adapter);

    db.defaults({ ...INTITIAL_DB_STATE }).write();
    return createResponse(db);
  }
  const adapter = new FileAsync("./db.json");
  const db = await lowdb(adapter);

  db.defaults({
    ...INTITIAL_DB_STATE,
    [`${API_ROUTES.events}`]: EVENTS,
    [`${API_ROUTES.fields}`]: FIELDS,
  }).write();
  return createResponse(db);
}
