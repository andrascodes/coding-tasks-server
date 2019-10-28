import request from "supertest";
import express from "express";
import createApp from "../app";
import lowdb from "lowdb";
import Memory from "lowdb/adapters/Memory";
import { MatchResponse } from "../types/database";
import { tearDownDb, setupDb } from "../testUtils";

let app: express.Application;
const port = "8080";
let db: lowdb.LowdbSync<any>;

beforeAll((): void => {
  const adapter = new Memory("");
  db = lowdb(adapter);

  db.defaults({
    events: [],
    fields: [],
  }).write();

  app = createApp({ port, db });
});

describe("GET /api/healthcheck", (): void => {
  it("should return status 200", async (): Promise<void> => {
    const res = await request(app).get("/api/healthcheck");
    expect(res.status).toEqual(200);
  });

  it("should return { result: 'success' }", async (): Promise<void> => {
    const res = await request(app).get("/api/healthcheck");
    expect(res.body).toEqual({ result: "success" });
  });
});

describe("ERROR route", (): void => {
  it("should return status 500", async (): Promise<void> => {
    const res = await request(app).get("/api/errorcheck");
    expect(res.status).toEqual(500);
  });
});

describe("NOT FOUND route", (): void => {
  it("should return status 500", async (): Promise<void> => {
    const res = await request(app).get("/route-that-not-exists");
    expect(res.status).toEqual(404);
  });
});

describe("GET /api/events", (): void => {
  afterEach(() => {
    tearDownDb(db);
  });

  it("should return status 200", async (): Promise<void> => {
    const res = await request(app).get("/api/events");
    expect(res.status).toEqual(200);
  });

  it("should return only upcoming matches with the field data included", async (): Promise<void> => {
    const [upcomingEventId, upcomingMatchFieldId] = setupDb(db);

    const result = await request(app)
      .get("/api/events")
      .then(res => res.body.data);

    expect(result.length).toBe(1);
    const upcomingMatch: MatchResponse = result[0];
    expect(upcomingMatch.id).toBe(upcomingEventId);
    expect(upcomingMatch).toHaveProperty("field");
    expect(upcomingMatch).not.toHaveProperty("fieldId");
    expect(upcomingMatch.field.id).toBe(upcomingMatchFieldId);
  });
});

describe("GET /api/events/:id", (): void => {
  afterEach(() => {
    tearDownDb(db);
  });
  it("should return 404 if resource is not found", async (): Promise<void> => {
    const res = await request(app).get("/api/events/1");
    expect(res.status).toEqual(404);
  });

  it("should return 200 if resource exists", async (): Promise<void> => {
    const [existingEventId] = setupDb(db);
    const res = await request(app).get(`/api/events/${existingEventId}`);
    expect(res.status).toEqual(200);
  });

  it("should return the match with the field included", async (): Promise<void> => {
    const [upcomingEventId, upcomingMatchFieldId, pastEventId, pastMatchFieldId] = setupDb(db);

    const upcomingMatch: MatchResponse = await request(app)
      .get(`/api/events/${upcomingEventId}`)
      .then(res => res.body.data);

    expect(upcomingMatch.id).toBe(upcomingEventId);
    expect(upcomingMatch).toHaveProperty("field");
    expect(upcomingMatch).not.toHaveProperty("fieldId");
    expect(upcomingMatch.field.id).toBe(upcomingMatchFieldId);

    const pastMatch: MatchResponse = await request(app)
      .get(`/api/events/${pastEventId}`)
      .then(res => res.body.data);

    expect(pastMatch.id).toBe(pastEventId);
    expect(pastMatch).toHaveProperty("field");
    expect(pastMatch).not.toHaveProperty("fieldId");
    expect(pastMatch.field.id).toBe(pastMatchFieldId);
  });
});

describe("GET /api/events", (): void => {
  afterEach(() => {
    tearDownDb(db);
  });

  it("should return status 200", async (): Promise<void> => {
    const res = await request(app).get("/api/events");
    expect(res.status).toEqual(200);
  });

  it("should return only upcoming matches with the field data included", async (): Promise<void> => {
    const [upcomingEventId, upcomingMatchFieldId] = setupDb(db);

    const result = await request(app)
      .get("/api/events")
      .then(res => res.body.data);

    expect(result.length).toBe(1);
    const upcomingMatch: MatchResponse = result[0];
    expect(upcomingMatch.id).toBe(upcomingEventId);
    expect(upcomingMatch).toHaveProperty("field");
    expect(upcomingMatch).not.toHaveProperty("fieldId");
    expect(upcomingMatch.field.id).toBe(upcomingMatchFieldId);
  });
});

describe("GET /api/fields", (): void => {
  // afterEach(() => {
  //   tearDownDb(db);
  // });

  it("should pass", async (): Promise<void> => {
    // const [existingEventId] = setupDb(db);
    // const res = await request(app).get(`/api/events/${existingEventId}`);
    // expect(res.status).toEqual(200);
  });

  // TODO: it should have a filter based on query params
  // TODO: it should have a filter based on query params
});
