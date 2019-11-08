import request from "supertest";
import express from "express";
import bcrypt from "bcrypt";
import createApp from "../app";
import { MatchResponse, Field, Database, User, Token } from "../types/database";
import { tearDownDb, setupDb, getUrl } from "../testUtils";
import API_ROUTES from "../constants/apiRoutes";
import createDB from "../db";
import ERRORS from "../constants/errors";

let app: express.Application;
const port = "8080";
let db: Database;

beforeAll(
  async (): Promise<void> => {
    db = await createDB({ test: true });
    app = createApp({ port, db });
  },
);

describe(`GET ${getUrl(API_ROUTES.healthcheck)}`, (): void => {
  it("should return status 200", async (): Promise<void> => {
    const res = await request(app).get(getUrl(API_ROUTES.healthcheck));
    expect(res.status).toEqual(200);
  });

  it("should return { result: 'success' }", async (): Promise<void> => {
    const res = await request(app).get(getUrl(API_ROUTES.healthcheck));
    expect(res.body).toEqual({ result: "success" });
  });
});

describe(`GET ${getUrl(API_ROUTES.errorcheck)}`, (): void => {
  it("should return status 500", async (): Promise<void> => {
    const res = await request(app).get(getUrl(API_ROUTES.errorcheck));
    expect(res.status).toEqual(500);
  });
});

describe("GET /route-that-not-exists", (): void => {
  it("should return status 500", async (): Promise<void> => {
    const res = await request(app).get("/route-that-not-exists");
    expect(res.status).toEqual(404);
  });
});

describe(`GET ${getUrl(API_ROUTES.events)}/:id`, (): void => {
  afterEach(() => {
    tearDownDb(db);
  });
  it("should return 404 if resource is not found", async (): Promise<void> => {
    const res = await request(app).get(`${getUrl(API_ROUTES.events)}/1`);
    expect(res.status).toEqual(404);
  });

  it("should return 200 if resource exists and the result should have a 'data' property", async (): Promise<void> => {
    const [existingEventId] = setupDb(db);
    const res = await request(app).get(`${getUrl(API_ROUTES.events)}/${existingEventId}`);
    expect(res.status).toEqual(200);

    expect(res.body).toHaveProperty("data");
  });

  it("should return the match with the field included", async (): Promise<void> => {
    const [upcomingEventId, upcomingMatchFieldId, pastEventId, pastMatchFieldId] = setupDb(db);

    const upcomingMatch: MatchResponse = await request(app)
      .get(`${getUrl(API_ROUTES.events)}/${upcomingEventId}`)
      .then(res => res.body.data);

    expect(upcomingMatch.id).toBe(upcomingEventId);
    expect(upcomingMatch).toHaveProperty("field");
    expect(upcomingMatch).not.toHaveProperty("fieldId");
    expect(upcomingMatch.field.id).toBe(upcomingMatchFieldId);

    const pastMatch: MatchResponse = await request(app)
      .get(`${getUrl(API_ROUTES.events)}/${pastEventId}`)
      .then(res => res.body.data);

    expect(pastMatch.id).toBe(pastEventId);
    expect(pastMatch).toHaveProperty("field");
    expect(pastMatch).not.toHaveProperty("fieldId");
    expect(pastMatch.field.id).toBe(pastMatchFieldId);
  });
});

describe(`GET ${getUrl(API_ROUTES.events)}`, (): void => {
  afterEach(() => {
    tearDownDb(db);
  });

  it("should return status 200 and the result should have a 'data' property", async (): Promise<void> => {
    const res = await request(app).get(getUrl(API_ROUTES.events));
    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty("data");
  });

  it("should return only upcoming matches with the field data included", async (): Promise<void> => {
    const [upcomingEventId, upcomingMatchFieldId] = setupDb(db);

    const result = await request(app)
      .get(getUrl(API_ROUTES.events))
      .then(res => res.body.data);

    expect(result.length).toBe(1);
    const upcomingMatch: MatchResponse = result[0];
    expect(upcomingMatch.id).toBe(upcomingEventId);
    expect(upcomingMatch).toHaveProperty("field");
    expect(upcomingMatch).not.toHaveProperty("fieldId");
    expect(upcomingMatch.field.id).toBe(upcomingMatchFieldId);
  });
});

describe(`GET ${getUrl(API_ROUTES.fields)}`, (): void => {
  afterEach(() => {
    tearDownDb(db);
  });

  it("should return status 200 and the result should have a 'data' property", async (): Promise<void> => {
    const res = await request(app).get(getUrl(API_ROUTES.fields));
    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty("data");
  });

  it("should return all fields if query param is omitted", async (): Promise<void> => {
    const [upcomingEventId, upcomingMatchFieldId, pastEventId, pastMatchFieldId] = setupDb(db);

    const result = await request(app)
      .get(getUrl(API_ROUTES.fields))
      .then(res => res.body.data);

    expect(result.length).toBe(2);
    const fieldIds = result.map((field: Field) => field.id);
    expect(fieldIds).toContain(upcomingMatchFieldId);
    expect(fieldIds).toContain(pastMatchFieldId);
  });

  it("should only return fields that match the query param", async (): Promise<void> => {
    const [upcomingEventId, upcomingMatchFieldId, pastEventId, pastMatchFieldId] = setupDb(db);

    const result = await request(app)
      .get(`${getUrl(API_ROUTES.fields)}?search="Langholmen"`)
      .then(res => res.body.data);

    expect(result.length).toBe(1);
    const fieldIds = result.map((field: Field) => field.id);
    expect(fieldIds).toContain(upcomingMatchFieldId);
    expect(fieldIds).not.toContain(pastMatchFieldId);
  });
});

describe(`POST ${getUrl(API_ROUTES.login)}`, (): void => {
  afterEach(() => {
    tearDownDb(db);
  });

  it("should return status 200 with the 'id' and 'username' in body and 'token' in header", async (): Promise<void> => {
    const res = await request(app)
      .post(getUrl(API_ROUTES.login))
      .set("Client-Id", `client_id`)
      .set("Authorization", `Basic ${Buffer.from("testuser:testpassword").toString("base64")}`);
    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data).toHaveProperty("username");
    expect(res.header).toHaveProperty("authorization");
    expect(res.header.authorization).toBeTruthy();
  });

  it("should create user and token in database if it does not exist", async (): Promise<void> => {
    const username = "testuser";
    const res = await request(app)
      .post(getUrl(API_ROUTES.login))
      .set("Client-Id", `client_id`)
      .set("Authorization", `Basic ${Buffer.from(`${username}:testpassword`).toString("base64")}`);

    const users = db.getUsers().value();
    expect(users.length).toBeGreaterThan(0);
    expect(users.map((user: User) => user.username)).toContain(username);

    const tokens = db.getTokens().value();
    expect(tokens.length).toBe(1);
    const token: Token = tokens[0];
    expect(token.username).toBe(username);
    const tokenInDbMatchesAuthHeader = await bcrypt.compare(res.header.authorization, token.tokenHash);
    expect(tokenInDbMatchesAuthHeader).toBeTruthy();
  });

  it("should return user in database if exists and password matches and create a new token", async (): Promise<
    void
  > => {
    const username = "testuser";
    const password = "testpassword";

    const { id: savedId } = await db.createUser({ username, password });
    expect(db.getUsers().value().length).toBe(1);

    const res = await request(app)
      .post(getUrl(API_ROUTES.login))
      .set("Client-Id", `client_id`)
      .set("Authorization", `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`);

    expect(db.getUsers().value().length).toBe(1);
    expect(res.body.data.id).toBe(savedId);
    expect(res.body.data.username).toBe(username);

    const tokens = db.getTokens().value();
    expect(tokens.length).toBe(1);
    const token: Token = tokens[0];
    expect(token.username).toBe(username);
    const tokenInDbMatchesAuthHeader = await bcrypt.compare(res.header.authorization, token.tokenHash);
    expect(tokenInDbMatchesAuthHeader).toBeTruthy();
  });

  it("should return 400 if no Client-Id is passed", async (): Promise<void> => {
    const res = await request(app)
      .post(getUrl(API_ROUTES.login))
      .set("Authorization", `Basic ${Buffer.from(`username:password`).toString("base64")}`);

    expect(res.status).toEqual(400);
    expect(res.body.code).toEqual(ERRORS.missingClientId.code);
    expect(res.body.error).toEqual(ERRORS.missingClientId.message);
  });

  it("should return 400 if no Authorization header is passed", async (): Promise<void> => {
    const res = await request(app)
      .post(getUrl(API_ROUTES.login))
      .set("Client-Id", `client_id`);

    expect(res.status).toEqual(400);
    expect(res.body.code).toEqual(ERRORS.wrongLoginRequest.code);
    expect(res.body.error).toEqual(ERRORS.wrongLoginRequest.message);
  });

  it("should return 400 if Authorization header is wrong format", async (): Promise<void> => {
    const res = await request(app)
      .post(getUrl(API_ROUTES.login))
      .set("Client-Id", `client_id`)
      .set("Authorization", `Basic username:password`);

    expect(res.status).toEqual(400);
    expect(res.body.code).toEqual(ERRORS.wrongLoginRequest.code);
    expect(res.body.error).toEqual(ERRORS.wrongLoginRequest.message);
  });

  it("should return 401 if user exists but password is not correct", async (): Promise<void> => {
    const username = "testuser";
    const password = "testpassword";

    await db.createUser({ username, password });
    expect(db.getUsers().value().length).toBe(1);

    const res = await request(app)
      .post(getUrl(API_ROUTES.login))
      .set("Client-Id", `client_id`)
      .set("Authorization", `Basic ${Buffer.from(`${username}:wrongpassword`).toString("base64")}`);

    expect(res.status).toEqual(401);
    expect(db.getUsers().value().length).toBe(1);
    expect(db.getTokens().value().length).toBe(0);
  });
});

describe(`GET an Authorized route`, () => {
  const url = `${getUrl("country")}?search=Hun`;
  it("should return 400 and missingToken error if token is not passed", async (): Promise<void> => {
    const res = await request(app).get(url);
    expect(res.status).toEqual(400);
    expect(res.body.code).toEqual(ERRORS.missingToken.code);
    expect(res.body.error).toEqual(ERRORS.missingToken.message);
  });

  it("should return 401 and invalidToken error if invalid token is passed", async (): Promise<void> => {
    const res = await request(app)
      .get(url)
      .set("Authorization", `Bearer `);
    expect(res.status).toEqual(401);
    expect(res.body.code).toEqual(ERRORS.invalidToken.code);
    expect(res.body.error).toEqual(ERRORS.invalidToken.message);
  });
});

describe(`GET ${getUrl("country")}?search="..."`, () => {
  let token: string;

  beforeAll(
    async (): Promise<void> => {
      const res = await request(app)
        .post(getUrl(API_ROUTES.login))
        .set("Client-Id", `client_id`)
        .set("Authorization", `Basic ${Buffer.from("testuser:testpassword").toString("base64")}`);
      token = res.header.authorization;
    },
  );
  it("should return an array with at least 1 element if search query is valid", async (): Promise<void> => {
    const res = await request(app)
      .get(`${getUrl("country")}?search=Hun`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.body).toHaveProperty("result");
    expect(res.body.result).toBeInstanceOf(Array);
    expect(res.body.result.length).toBeGreaterThan(0);
  });

  it("should return an empty array if search query is invalid", async (): Promise<void> => {
    const res = await request(app)
      .get(`${getUrl("country")}?search=Hug`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.body).toHaveProperty("result");
    expect(res.body.result).toBeInstanceOf(Array);
    expect(res.body.result.length).toBe(0);
  });

  it("should return 400 and wrongSearchRequest error if search query is empty", async (): Promise<void> => {
    const res = await request(app)
      .get(`${getUrl("country")}?search=`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toEqual(ERRORS.wrongSearchRequest.code);
    expect(res.body.error).toEqual(ERRORS.wrongSearchRequest.message);
  });

  it("should return 400 and wrongSearchRequest error if search query param is omitted", async (): Promise<void> => {
    const res = await request(app)
      .get(`${getUrl("country")}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toEqual(ERRORS.wrongSearchRequest.code);
    expect(res.body.error).toEqual(ERRORS.wrongSearchRequest.message);
  });

  afterAll(() => {
    tearDownDb(db);
  });
});

// describe GET country/:code
// valid code
// invalid code
// country with obscure currency
describe(`GET ${getUrl("country")}/:code`, () => {
  let token: string;

  beforeAll(
    async (): Promise<void> => {
      const res = await request(app)
        .post(getUrl(API_ROUTES.login))
        .set("Client-Id", `client_id`)
        .set("Authorization", `Basic ${Buffer.from("testuser:testpassword").toString("base64")}`);
      token = res.header.authorization;
    },
  );
  it(`should return result with country name, code, flag, 
  population and currencies (inc. exchange rate) if code is valid`, async (): Promise<void> => {
    const res = await request(app)
      .get(`${getUrl("country")}/HUN`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.body).toHaveProperty("result");
    expect(res.body.result).toHaveProperty("name");
    expect(res.body.result).toHaveProperty("alpha3Code");
    expect(res.body.result).toHaveProperty("flag");
    expect(res.body.result).toHaveProperty("population");
    expect(res.body.result).toHaveProperty("currencies");
    expect(res.body.result.currencies).toBeInstanceOf(Array);
    expect(res.body.result.currencies.length).toBeGreaterThan(0);
    expect(res.body.result.currencies[0]).toHaveProperty("base");
    expect(res.body.result.currencies[0]).toHaveProperty("code");
    expect(res.body.result.currencies[0]).toHaveProperty("rate");
    expect(res.body.result.currencies[0].rate).not.toBe(null);
  });

  it("should return ? if code is invalid", async (): Promise<void> => {
    const res = await request(app)
      .get(`${getUrl("country")}/asdasd`)
      .set("Authorization", `Bearer ${token}`);
      expect(res.status).toEqual(404);
      expect(res.body).toHaveProperty("error");
      expect(res.body).toHaveProperty("code");
      expect(res.body.error).toBe(ERRORS.resourceNotFound.message);
      expect(res.body.code).toBe(ERRORS.resourceNotFound.code);
  });

  it("should return ? if country currency is not supported by currency API", async (): Promise<void> => {
    const res = await request(app)
      .get(`${getUrl("country")}/BFA`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.body).toHaveProperty("result");
    expect(res.body.result).toHaveProperty("name");
    expect(res.body.result).toHaveProperty("alpha3Code");
    expect(res.body.result).toHaveProperty("flag");
    expect(res.body.result).toHaveProperty("population");
    expect(res.body.result).toHaveProperty("currencies");
    expect(res.body.result.currencies).toBeInstanceOf(Array);
    expect(res.body.result.currencies.length).toBeGreaterThan(0);
    expect(res.body.result.currencies[0]).toHaveProperty("base");
    expect(res.body.result.currencies[0]).toHaveProperty("code");
    expect(res.body.result.currencies[0]).toHaveProperty("rate");
    expect(res.body.result.currencies[0].rate).toBe(null);
  });

  afterAll(() => {
    tearDownDb(db);
  });
});
