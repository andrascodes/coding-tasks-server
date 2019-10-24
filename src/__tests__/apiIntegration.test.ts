import request from "supertest";
import express from "express";
import createApp from "../app";

let app: express.Application;
const port = "8080";
beforeAll((): void => {
  app = createApp({ port });
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
