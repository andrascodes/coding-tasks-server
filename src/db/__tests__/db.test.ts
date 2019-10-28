import createDB from "../";

describe("DB", (): void => {
  it("should be a function", (): void => {
    expect(createDB).toBeInstanceOf(Function);
  });
});
