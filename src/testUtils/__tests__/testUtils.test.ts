import lowdb from "lowdb";
import Memory from "lowdb/adapters/Memory";
import { setupDb, tearDownDb, getUrl } from "../";
import { Match, Field, Database } from "../../types/database";
import createDB from "../../db";

let db: Database;

beforeAll(
  async (): Promise<void> => {
    db = await createDB({ test: true });
  },
);

describe("tearDownDb", () => {
  it("should empty out DB", (): void => {
    db.getEvents()
      .push({ id: "test" })
      .write();
    db.getFields()
      .push({ id: "test" })
      .write();

    expect(db.getEvents().value().length).toBeGreaterThan(0);
    expect(db.getFields().value().length).toBeGreaterThan(0);

    tearDownDb(db);

    expect(db.getEvents().value().length).toEqual(0);
    expect(db.getFields().value().length).toEqual(0);
  });
});

describe("setupDb", () => {
  it("should add test data to DB", (): void => {
    db.setEvents([]).write();
    db.setFields([]).write();

    const [upcomingEventId, upcomingMatchFieldId, pastEventId, pastMatchFieldId] = setupDb(db);

    const events = db.getEvents().value();
    const fields = db.getFields().value();

    const eventIds = events.map((event: Match) => event.id);
    const fieldIds = fields.map((field: Field) => field.id);

    expect(eventIds).toContain(upcomingEventId);
    expect(eventIds).toContain(pastEventId);
    expect(fieldIds).toContain(upcomingMatchFieldId);
    expect(fieldIds).toContain(pastMatchFieldId);

    db.setEvents([]).write();
    db.setFields([]).write();
  });
});

describe("getUrl", () => {
  it("should return endpoint with /api prefix", (): void => {
    const endpoint = "endpoint";
    const url = getUrl(endpoint);
    expect(url).toBe(`/api/${endpoint}`);
  });
});
