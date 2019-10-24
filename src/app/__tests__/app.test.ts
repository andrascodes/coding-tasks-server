import createApp from "..";

describe("createApp exported from app", (): void => {
  it("should be a function", (): void => {
    expect(createApp).toBeInstanceOf(Function);
  });

  it("should return an express app with proper PORT", (): void => {
    const port = "8080";
    const app = createApp({ port });
    expect(app.listen).toBeDefined();
    expect(app.get("port")).toBe(port);
  });
});
