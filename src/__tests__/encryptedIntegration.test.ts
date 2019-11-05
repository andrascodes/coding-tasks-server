import request from "supertest";
import express from "express";
import CryptoJS from "crypto-js";
import createApp from "../app";
import { Database, Item } from "../types/database";
import { tearDownDb, setupDb } from "../testUtils";
import createDB from "../db";
import { ENCRYPTED_ROUTE_ERRORS as ERRORS } from "../constants/errors";
import API_ROUTES from "../constants/apiRoutes";

const createUrl = (endpoint: string): string => `/encrypted/${endpoint}`;

let app: express.Application;
const port = "8080";
let db: Database;

beforeAll(
  async (): Promise<void> => {
    db = await createDB({ test: true });
    app = createApp({ port, db });
  },
);

describe(`GET ${createUrl(API_ROUTES.healthcheck)}`, (): void => {
  it("should return status 200", async (): Promise<void> => {
    const res = await request(app).get(createUrl(API_ROUTES.healthcheck));
    expect(res.status).toEqual(200);
  });

  it("should return { result: 'success' }", async (): Promise<void> => {
    const res = await request(app).get(createUrl(API_ROUTES.healthcheck));
    expect(res.body).toEqual({ result: "success" });
  });
});

describe(`GET ${createUrl(API_ROUTES.errorcheck)}`, (): void => {
  it("should return status 500", async (): Promise<void> => {
    const res = await request(app).get(createUrl(API_ROUTES.errorcheck));
    expect(res.status).toEqual(500);
  });
});

describe(`POST ${createUrl(API_ROUTES.items)}/:id`, (): void => {
  afterEach(() => {
    tearDownDb(db);
  });

  it("should return missingEncryptionKey error if Authorization header is missing", async (): Promise<void> => {
    const itemId = "1";
    const res = await request(app).post(`${createUrl(API_ROUTES.items)}/${itemId}`);
    expect(res.status).toEqual(401);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("code");
    expect(res.body.error).toBe(ERRORS.missingEncryptionKey.message);
    expect(res.body.code).toBe(ERRORS.missingEncryptionKey.code);
  });

  it("should return wrongRequestBody error if 'value' is missing from request body", async (): Promise<void> => {
    const itemId = "1";
    const encryptionKey = "encryption_key";
    const res = await request(app)
      .post(`${createUrl(API_ROUTES.items)}/${itemId}`)
      .set("Authorization", encryptionKey);
    expect(res.status).toEqual(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("code");
    expect(res.body.error).toBe(ERRORS.wrongRequestBody.message);
    expect(res.body.code).toBe(ERRORS.wrongRequestBody.code);
  });

  it("should save new data in database at specified id", async (): Promise<void> => {
    const itemId = "1";
    const encryptionKey = "encryption_key";
    const value = { test: "value" };
    const res = await request(app)
      .post(`${createUrl(API_ROUTES.items)}/${itemId}`)
      .send({ value })
      .set("Authorization", encryptionKey);

    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body.id).toBe(itemId);

    const itemInDb = db
      .getItems()
      .value()
      .find(({ id }: Item) => id === itemId);
    expect(itemInDb).toHaveProperty("id");
    expect(itemInDb).toHaveProperty("value");
    expect(itemInDb.id).toBe(itemId);
    expect(itemInDb.value).not.toBe(value);
    expect(typeof itemInDb.value).toBe("string");
  });

  it("should overwrite data in database at specified id", async (): Promise<void> => {
    const itemId = "1";
    const existingValue = "value to be overwritten";
    db.getItems()
      .push({ id: itemId, value: existingValue })
      .write();

    const encryptionKey = "encryption_key";
    const value = { test: "value" };
    const res = await request(app)
      .post(`${createUrl(API_ROUTES.items)}/${itemId}`)
      .send({ value })
      .set("Authorization", encryptionKey);

    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body.id).toBe(itemId);

    const itemInDb = db
      .getItems()
      .value()
      .find(({ id }: Item) => id === itemId);

    expect(itemInDb).toHaveProperty("id");
    expect(itemInDb).toHaveProperty("value");
    expect(itemInDb.id).toBe(itemId);
    expect(itemInDb.value).not.toBe(existingValue);
    expect(itemInDb.value).not.toBe(value);
    expect(typeof itemInDb.value).toBe("string");
  });
});

describe(`GET ${createUrl(API_ROUTES.items)}/:id`, (): void => {
  afterEach(() => {
    tearDownDb(db);
  });

  it("should return missingDecryptionKey error if Authorization header is missing", async (): Promise<void> => {
    const itemId = "1";
    const res = await request(app).get(`${createUrl(API_ROUTES.items)}/${itemId}`);
    expect(res.status).toEqual(401);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("code");
    expect(res.body.error).toBe(ERRORS.missingDecryptionKey.message);
    expect(res.body.code).toBe(ERRORS.missingDecryptionKey.code);
  });

  it("should return 404 if resource does not exists", async (): Promise<void> => {
    const itemId = "999";
    const encryptionKey = "encryption_key";
    const res = await request(app)
      .get(`${createUrl(API_ROUTES.items)}/${itemId}`)
      .set("Authorization", encryptionKey);
    expect(res.status).toEqual(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("code");
    expect(res.body.error).toBe(ERRORS.resourceNotFound.message);
    expect(res.body.code).toBe(ERRORS.resourceNotFound.code);
  });

  it("should not return the resource if decryptionKey is not correct", async (): Promise<void> => {
    const itemId = "1";
    const value = { test: "value" };
    const rightEncryptionKey = "encryption_key";
    const wrongEncryptionKey = "wrong_encryption_key";

    const encryptedValue = CryptoJS.AES.encrypt(JSON.stringify(value), rightEncryptionKey).toString();
    db.getItems()
      .push({
        id: itemId,
        value: encryptedValue,
      })
      .write();

    const res = await request(app)
      .get(`${createUrl(API_ROUTES.items)}/${itemId}`)
      .set("Authorization", wrongEncryptionKey);

    expect(res.status).toEqual(200);
    expect(res.body.length).toBe(0);
  });

  it("should return all resources that could be decrypted", async (): Promise<void> => {
    const noAccessId = "3";
    const items = [
      {
        id: "1",
        value: { test: "value" },
      },
      {
        id: "2",
        value: { hello: "world" },
      },
      {
        id: noAccessId,
        value: { no: "access" },
      },
    ];
    const rightEncryptionKey = "encryption_key";
    const wrongEncryptionKey = "wrong_encryption_key";

    const encryptedValues: Item[] = items.map(item => {
      if (item.id === noAccessId) {
        return { ...item, value: CryptoJS.AES.encrypt(JSON.stringify(item.value), wrongEncryptionKey).toString() };
      }
      return { ...item, value: CryptoJS.AES.encrypt(JSON.stringify(item.value), rightEncryptionKey).toString() };
    });

    db.getItems()
      .push(...encryptedValues)
      .write();

    const res = await request(app)
      .get(`${createUrl(API_ROUTES.items)}/*`)
      .set("Authorization", rightEncryptionKey);

    expect(res.status).toEqual(200);
    const resultIds = res.body.map(({ id }: Item) => id);

    expect(resultIds.length).toBe(2);
    expect(resultIds).toContain("1");
    expect(resultIds).toContain("2");
  });
});
