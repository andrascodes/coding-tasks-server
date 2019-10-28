import lowdb from "lowdb";

export function tearDownDb(db: lowdb.LowdbSync<any>): void {
  db.set("events", []).write();
  db.set("fields", []).write();
}

export function setupDb(db: lowdb.LowdbSync<any>): number[] {
  const events: any = db.get("events");
  const fields: any = db.get("fields");

  const upcomingEventId = 1;
  const upcomingStart = Date.now() / 1000 + 86400;
  const upcomingMatchFieldId = 2;
  const pastMatchFieldId = 6;
  const pastEventId = 2;
  const pastStart = Date.now() / 1000 - 86400;

  events
    .push(
      {
        id: upcomingEventId,
        title: "Friendly Football",
        fieldId: upcomingMatchFieldId,
        start: upcomingStart,
        end: upcomingStart + 3600,
      },
      {
        id: pastEventId,
        title: "SCBC Football",
        fieldId: pastMatchFieldId,
        start: pastStart,
        end: pastStart + 3600,
      },
    )
    .write();

  fields
    .push({
      id: upcomingMatchFieldId,
      name: "Långholmens bollplan",
      address: {
        street: "Alstaviksvägen 9",
        city: "Stockholm",
        zipcode: "117 33",
        country: "Sweden",
        location: {
          lat: 59.320351,
          lng: 18.02859,
        },
      },
    })
    .push({
      id: pastMatchFieldId,
      name: "Axelsbergs Bollplan",
      address: {
        street: "Eolshällsvägen 1",
        city: "Hägersten",
        zipcode: "129 37",
        country: "Sweden",
        location: {
          lat: 59.30566,
          lng: 17.969849,
        },
      },
    })
    .write();

  return [upcomingEventId, upcomingMatchFieldId, pastEventId, pastMatchFieldId];
}
