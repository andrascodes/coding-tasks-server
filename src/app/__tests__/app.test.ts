import createApp from "..";
import createDB from "../../db";

jest.mock("../../db");

describe("createApp exported from app", (): void => {
  it("should be a function", (): void => {
    expect(createApp).toBeInstanceOf(Function);
  });

  it("should return an express app with proper PORT", async (): Promise<void> => {
    const port = "8080";
    const db = await createDB();
    const app = createApp({ port, db });
    expect(app.get("port")).toBe(port);
  });
});
