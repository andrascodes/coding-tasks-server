export default {
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
  missingClientId: {
    message: `Please specify the "Client-Id" header!`,
    statusCode: 400,
    code: "MISSING_CLIENT_ID",
  },
  wrongLoginRequest: {
    message:
      "Please specify the login credentials in the Authorization header like so: 'Basic {Base64(username:password)}'!",
    statusCode: 400,
    code: "WRONG_LOGIN_REQUEST",
  },
  incorrectLogin: {
    message: "The username or password was incorrect.",
    statusCode: 401,
    code: "INCORRECT_USERNAME_OR_PASSWORD",
  },
  missingToken: {
    message: "Please specify the API token in the Authorization header like so: 'Bearer {API_TOKEN}'",
    statusCode: 400,
    code: "MISSING_TOKEN",
  },
  invalidToken: {
    message: "The passed API token was invalid",
    statusCode: 401,
    code: "INVALID_TOKEN",
  },
  limitReached: {
    message: "The request limit for this API endpoint has been reached.",
    statusCode: 429,
    code: "LIMIT_REACHED",
  },
  wrongSearchRequest: {
    message: "Please specify the query parameter 'search' on the request!",
    statusCode: 400,
    code: "MISSING_SEARCH_PARAM",
  },
};
