import lowdb from "lowdb";
import FileAsync from "lowdb/adapters/FileAsync";
import FIELDS from "./fields";
import EVENTS from "./events";
import { Schema } from "../types/database";

// // Set some defaults (required if your JSON file is empty)
// db.defaults({ posts: [], user: {}, count: 0 }).write();

// // Add a post
// db.get("posts")
//   .push({ id: 1, title: "lowdb is awesome" })
//   .write();

// // Set a user using Lodash shorthand syntax
// db.set("user.name", "typicode").write();

// // Increment count
// db.update("count", n => n + 1).write();

export default async function createDB(): Promise<lowdb.LowdbAsync<Schema>> {
  const adapter = new FileAsync("./db.json");
  const db = await lowdb(adapter);

  db.defaults({ events: EVENTS, fields: FIELDS }).write();

  return db;
}
