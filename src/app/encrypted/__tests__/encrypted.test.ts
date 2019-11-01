import createEncryptedRouter from "..";

describe("createApiRouter exported from api", (): void => {
  it("should be a function", (): void => {
    expect(createEncryptedRouter).toBeInstanceOf(Function);
  });
});
