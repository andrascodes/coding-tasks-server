import lowdb from "lowdb";
import Memory from "lowdb/adapters/Memory";
import FileAsync from "lowdb/adapters/FileAsync";
import bcrypt from "bcrypt";
import shortid from "shortid";
import CryptoJS from "crypto-js";
import FIELDS from "./fields";
import EVENTS from "./events";
import API_ROUTES from "../constants/apiRoutes";
import { Database, User, AuthInput, Token, UserWithToken } from "../types/database";
import { cryptoPassword } from "../config";
import jwt from "../lib/jwt";

interface TokenMatch {
  tokenObject: Token;
  match: boolean;
}

function createResponse(db: any): Database {
  function getUsers(): any {
    const usersDbObject: any = db.get(API_ROUTES.users);
    return usersDbObject;
  }

  function getTokens(): any {
    const tokensDbObject: any = db.get("tokens");
    return tokensDbObject;
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
    getItems(): any {
      const postsDbObject: any = db.get(API_ROUTES.items);
      return postsDbObject;
    },
    setItems(value): any {
      return db.set(API_ROUTES.items, value);
    },
    getTokens,
    setTokens(value): any {
      return db.set("tokens", value);
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
    async createToken(user: User, clientId: string): Promise<string> {
      const payload = { id: user.id };
      const token = jwt.sign(payload, { subject: user.username, audience: clientId });

      const newToken: Token = { tokenHash: await bcrypt.hash(token, 10), username: user.username, client: clientId };

      getTokens()
        .push(newToken)
        .write();

      return token;
    },
    async authorizeUser(token: string): Promise<UserWithToken> {
      const tokensInDb = await getTokens().value();
      const tokenChecks = await Promise.all(
        tokensInDb.map(
          async (tokenObject: Token): Promise<TokenMatch> => {
            const match = await bcrypt.compare(token, tokenObject.tokenHash);
            return {
              tokenObject,
              match,
            };
          },
        ),
      );
      const tokenFound = (tokenChecks as TokenMatch[]).find(({ match }) => match === true);
      if (!tokenFound) throw new Error("Invalid Token");

      const { id } = jwt.verify(token, {
        subject: tokenFound.tokenObject.username,
        audience: tokenFound.tokenObject.client,
      });

      const userObject = getUsers()
        .find({ id })
        .value();

      if (!userObject) throw new Error("The token specified a user id that does not exists");

      const user = userObject as User;

      return {
        id: user.id,
        username: user.username,
        token,
      };
    },
  };
}

export default async function createDB(options = { test: false }): Promise<Database> {
  const INTITIAL_DB_STATE = {
    [`${API_ROUTES.events}`]: [],
    [`${API_ROUTES.fields}`]: [],
    [`${API_ROUTES.users}`]: [],
    [`${API_ROUTES.rsvps}`]: [],
    [`${API_ROUTES.items}`]: [],
    [`tokens`]: [],
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
