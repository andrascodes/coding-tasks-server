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
  const pastEventId = 2;
  const pastStart = Date.now() / 1000 - 86400;

  events
    .push(
      {
        id: upcomingEventId,
        title: "Friendly Football",
        fieldId: 2,
        start: upcomingStart,
        end: upcomingStart + 3600,
      },
      {
        id: pastEventId,
        title: "Lappis Football",
        fieldId: 2,
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
    .write();

  return [upcomingEventId, upcomingMatchFieldId, pastEventId, upcomingMatchFieldId];
}
