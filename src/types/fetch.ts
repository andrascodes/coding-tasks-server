import { RequestInfo, RequestInit, Response } from "node-fetch";

export default interface Fetch {
  (url: RequestInfo, init?: RequestInit): Promise<Response>;
}
