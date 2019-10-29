import lowdb from "lowdb";
import Memory from "lowdb/adapters/Memory";
import { setupDb, tearDownDb, getUrl } from "../";
import { Match, Field } from "../../types/database";

let db: lowdb.LowdbSync<any>;

beforeAll((): void => {
  const adapter = new Memory("");
  db = lowdb(adapter);

  db.defaults({
    events: [],
    fields: [],
  }).write();
});

describe("tearDownDb", () => {
  it("should empty out DB", (): void => {
    const events: any = db.get("events");
    const fields: any = db.get("fields");

    events.push({ id: "test" }).write();
    fields.push({ id: "test" }).write();

    expect(db.get("events").value().length).toBeGreaterThan(0);
    expect(db.get("fields").value().length).toBeGreaterThan(0);

    tearDownDb(db);

    expect(db.get("events").value().length).toEqual(0);
    expect(db.get("fields").value().length).toEqual(0);
  });
});

describe("setupDb", () => {
  it("should add test data to DB", (): void => {
    db.set("events", []).write();
    db.set("fields", []).write();

    const [upcomingEventId, upcomingMatchFieldId, pastEventId, pastMatchFieldId] = setupDb(db);

    const events = db.get("events").value();
    const fields = db.get("fields").value();

    const eventIds = events.map((event: Match) => event.id);
    const fieldIds = fields.map((field: Field) => field.id);

    expect(eventIds).toContain(upcomingEventId);
    expect(eventIds).toContain(pastEventId);
    expect(fieldIds).toContain(upcomingMatchFieldId);
    expect(fieldIds).toContain(pastMatchFieldId);

    db.set("events", []).write();
    db.set("fields", []).write();
  });
});

describe("getUrl", () => {
  it("should return endpoint with /api prefix", (): void => {
    const endpoint = "endpoint";
    const url = getUrl(endpoint);
    expect(url).toBe(`/api/${endpoint}`);
  });
});
