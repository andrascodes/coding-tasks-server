import request from "supertest";
import express from "express";
import createApp from "../app";
import { MatchResponse, Field, Database } from "../types/database";
import { tearDownDb, setupDb, getUrl } from "../testUtils";
import API_ROUTES from "../constants/apiRoutes";
import createDB from "../db";

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

  it("should return status 200 and the result should have a 'data/token' properties", async (): Promise<void> => {
    const res = await request(app)
      .post(getUrl(API_ROUTES.login))
      .set("Authorization", `Basic ${Buffer.from("testuser:testpassword").toString("base64")}`);
    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("token");
  });

  it("should create user in database if it does not exist", (): void => {});

  it("should return user in database if exists and password matches", (): void => {});

  it("should return 400 if request has no Authorization header or the header is invalid", (): void => {});

  it("should return 401 if user exists but password does not match", (): void => {});

  // it("", (): void => {

  // })

  // it("should return all fields if query param is omitted", async (): Promise<void> => {
  //   const [upcomingEventId, upcomingMatchFieldId, pastEventId, pastMatchFieldId] = setupDb(db);

  //   const result = await request(app)
  //     .get("/api/fields")
  //     .then(res => res.body.data);

  //   expect(result.length).toBe(2);
  //   const fieldIds = result.map((field: Field) => field.id);
  //   expect(fieldIds).toContain(upcomingMatchFieldId);
  //   expect(fieldIds).toContain(pastMatchFieldId);
  // });

  // it("should only return fields that match the query param", async (): Promise<void> => {
  //   const [upcomingEventId, upcomingMatchFieldId, pastEventId, pastMatchFieldId] = setupDb(db);

  //   const result = await request(app)
  //     .get(`/api/fields?search="Langholmen"`)
  //     .then(res => res.body.data);

  //   expect(result.length).toBe(1);
  //   const fieldIds = result.map((field: Field) => field.id);
  //   expect(fieldIds).toContain(upcomingMatchFieldId);
  //   expect(fieldIds).not.toContain(pastMatchFieldId);
  // });
});
