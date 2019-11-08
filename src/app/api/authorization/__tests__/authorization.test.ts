import createAuthorizationMiddleware from "../";
import createDB from "../../../../db";
import { setupDb, tearDownDb } from "../../../../testUtils";
import { Database, UserWithToken } from "../../../../types/database";
import { RequestHandler, Request } from "express";

const mockRequest = (authHeaderValue?: string): any => ({ header: jest.fn(() => authHeaderValue) });
const mockResponse = (): any => ({
  locals: {},
  status: jest.fn(() => ({ format: () => ({}) })),
  json: jest.fn(),
  type: jest.fn(),
});

describe("Authorization middleware", () => {
  let db: Database;
  let authorizationMiddleware: RequestHandler;
  let req: Request;

  beforeAll(
    async (): Promise<void> => {
      db = await createDB({ test: true });
      authorizationMiddleware = createAuthorizationMiddleware(db);
    },
  );

  beforeEach(() => {
    setupDb(db);
  });

  it("should call res.status with 400 when no token passed in Authorization header", async (): Promise<void> => {
    const req = mockRequest();
    const res = mockResponse();
    const next = jest.fn();
    await authorizationMiddleware(req, res, next);
    expect(req.header).toHaveBeenCalledWith("Authorization");
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should call res.status with 401 when an invalid token is passed in Authorization header", async (): Promise<
    void
  > => {
    const req = mockRequest("token");
    const res: any = mockResponse();
    const next = jest.fn();
    await authorizationMiddleware(req, res, next);
    expect(req.header).toHaveBeenCalledWith("Authorization");
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should call res.status with 401 when a valid token is passed for a non-existent user", async (): Promise<
    void
  > => {
    const token = await db.createToken({ id: "wrongId", username: "name", password: "pw" }, "clientId");
    const req = mockRequest(token);
    const res: any = mockResponse();
    const next = jest.fn();

    await authorizationMiddleware(req, res, next);
    expect(req.header).toHaveBeenCalledWith("Authorization");
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return the user.id, user.username and token on the res.locals.user", async (): Promise<void> => {
    const user = await db.createUser({ username: "name", password: "pw" });
    const token = await db.createToken(user, "clientId");
    const userWithToken: UserWithToken = { username: user.username, id: user.id, token };
    const req = mockRequest(token);
    const res: any = mockResponse();
    const next = jest.fn();

    await authorizationMiddleware(req, res, next);
    expect(req.header).toHaveBeenCalledWith("Authorization");
    expect(res.locals).toHaveProperty("user");
    expect(res.locals.user).toEqual(userWithToken);
  });

  afterEach(() => {
    tearDownDb(db);
  });
});
