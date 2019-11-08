// Source: https://medium.com/@siddharthac6/json-web-token-jwt-the-right-way-of-implementing-with-node-js-65b8915d550e

import jwt from "jsonwebtoken";
import { Signature } from "jws";
import { jwtPublicKey, jwtPrivateKey, issuerId } from "../../config";

const OPTIONS = {
  issuer: issuerId,
  expiresIn: "30d",
  algorithm: "RS256",
};

interface OptionsObject {
  subject: string;
  audience: string;
}

interface VerifyResult {
  id: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  sub: string;
}

const jwtModule = {
  sign(payload: object, options: OptionsObject): string {
    return jwt.sign(payload, jwtPrivateKey, {
      ...OPTIONS,
      ...options,
    });
  },
  verify(token: string, options: OptionsObject): VerifyResult {
    const verifyResult: any = jwt.verify(token, jwtPublicKey, {
      ...OPTIONS,
      ...options,
    });
    return verifyResult;
  },
  decode(token: string): Signature {
    const decodeResults: any = jwt.decode(token, { complete: true });
    if (!decodeResults) throw new Error("Invalid JWT");

    return decodeResults as Signature;
  },
};

export default jwtModule;
