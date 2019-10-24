import createApiRouter from "..";

describe("createApiRouter exported from api", (): void => {
  it("should be a function", (): void => {
    expect(createApiRouter).toBeInstanceOf(Function);
  });
});
