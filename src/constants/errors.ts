export const ENCRYPTED_ROUTE_ERRORS = {
  missingDecryptionKey: {
    message: "Please specify the decryption key in the Authorization header!",
    statusCode: 401,
    code: "MISSING_DECRYPTION_KEY",
  },
  wrongRequestBody: {
    message: "Please specify the value property on the request body!",
    statusCode: 400,
    code: "WRONG_REQUEST_BODY",
  },
  missingEncryptionKey: {
    message: "Please specify the encryption key in the Authorization header!",
    statusCode: 401,
    code: "MISSING_ENCRYPTION_KEY",
  },
  resourceNotFound: {
    message: "Resource with the specified 'id' was not found.",
    statusCode: 404,
    code: "RESOURCE_NOT_FOUND",
  },
};
