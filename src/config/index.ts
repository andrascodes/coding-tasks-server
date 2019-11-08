import fs from "fs";
import logger from "./winston";

const devEnvironment = process.env.NODE_ENV === "development";

const cryptoPassword = process.env.CRYPTO_PASSWORD || "testPassword";
const jwtPublicKey = devEnvironment
  ? fs.readFileSync("./public.key", "utf8")
  : process.env.JWT_PUBLIC_KEY || "testPublicKey";
const jwtPrivateKey = devEnvironment
  ? fs.readFileSync("./private.key", "utf8")
  : process.env.JWT_PRIVATE_KEY || "testPrivateKey";
const issuerId = process.env.ISSUER_ID || "testServer";
const countriesApiUrl = process.env.COUNTRIES_API_URL;
const exchangeRateApiUrl = process.env.CURRENCIES_API_URL;

export { logger, cryptoPassword, jwtPublicKey, jwtPrivateKey, issuerId, countriesApiUrl, exchangeRateApiUrl };
