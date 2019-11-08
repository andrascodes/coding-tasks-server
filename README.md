# coding-tasks-server

Server for Coding Tasks

---

## 1. Installation

In the project directory, you can run:

### `yarn install`

Installs the dependencies from NPM.

## 2. Run in development mode

Create a `.env` file in the project root folder with the following values:

```
NODE_ENV="development"
PORT=8080
LOG_LEVEL=info
```

Then run the follwing command:

### `yarn dev`

Runs the app in the development mode.<br />
Open [http://localhost:<PORT you specified in .env>] to view it in the browser.

The server will restart if you make edits.<br />
You will also see any lint errors in the console.

## 3. Run tests

### `yarn test`

Launches the test runner in the interactive watch mode with the `LOG_LEVEL` set to `none`, so it doesn't log anything apart from test errors.<br />

## 4. Start in production

### `yarn build && yarn start`

Builds the app for production to the `dist` folder.<br />
Then starts the app with the `./dist/index.js` file.

---

# Documentation

## Encrypted items routes (open):

Implementation in:

```
./src/app/encrypted
```

Lets you store and retrieve an arbitrary JSON or string in the DB in an encrypted form.

- [Storing Endpoint](#storing-endpoint): `POST /encrypted/items/:id`
- [Retrieval Endpoint](#retrieval-endpoint): `GET /encrypted/items/:id`

## API routes (req. auth):

Implementation in:

```
./src/app/api
```

Lets you login, generate a JWT token and call the endpoints to get information about countries and currency exchange rates with that token.

- [Login Endpoint](#login-endpoint): `POST /api/login`
- [Country Search Endpoint](#country-search-endpoint): `GET /api/county?search=...`
- [Country Details Endpoint](#country-details-endpoint): `GET /api/country/:code`

---

## Storing Endpoint

Used to store a JSON or string in the DB in an encrypted form.

**URL** : `/encrypted/items/:id`

**Parameter constraints**:

- `id`: The unique `'id'` to store the data on. If the same key already exists, the data will be overwritten.

**Method** : `POST`

**Auth required** : YES<br>
Place an **encryption key** (any string value) into the `Authorization` header of the request.

**Data constraints**

```json
{
  "value": "[JSON or string]"
}
```

**Data example**

```json
{
  "value": {
    "paymentId": "1231231231",
    "amount": "5000",
    "currency": "SEK"
  }
}
```

### Success Response

**Code** : `200 OK`

**Content example**

```json
{
  "id": "1",
  "result": "success"
}
```

### Errors

#### Missing encryption key

**Condition** : If `Authorization` header does not exist.

**Code** : `401 Unauthorized`

**Content** :

```json
{
  "error": "Please specify the encryption key in the Authorization header!",
  "code": "MISSING_ENCRYPTION_KEY"
}
```

#### Wrong request body

**Condition** : If `value` field is missing from request body.

**Code** : `400 Bad Request`

**Content** :

```json
{
  "error": "Please specify the value property on the request body!",
  "code": "WRONG_REQUEST_BODY"
}
```

---

## Retrieval Endpoint

Used to retrieve the JSON or string value in the DB in decrypted form using a decryption key.

**URL** : `/encrypted/items/:id`

**Parameter constraints**:

- `id`: The exact `'id'` to query or `'*'` to query all the records that can be decrypted with the specified decryption key.

**Method** : `GET`

**Auth required** : YES<br>
Place the **decryption key** (any string value, same as the one you used to encrypt the value) into the `Authorization` header of the request.

**Data example**

```json
{
  "value": {
    "paymentId": "1231231231",
    "amount": "5000",
    "currency": "SEK"
  }
}
```

### Success Response

**Code** : `200 OK`

**Content example**

```json
[
  {
    "id": "1",
    "value": {
      "paymentId": "1231231231",
      "amount": "5000",
      "currency": "SEK"
    }
  }
]
```

Or

```json
[
  {
    "id": "1",
    "value": ...
  },
  {
    "id": "2",
    "value": ...
  }
]
```

Or

```json
// If no items could be decrypted with the specified key.
[]
```

### Errors

#### Missing decryption key

**Condition** : If `Authorization` header does not exist.

**Code** : `401 Unauthorized`

**Content** :

```json
{
  "error": "Please specify the decryption key in the Authorization header!",
  "code": "MISSING_DECRYPTION_KEY"
}
```

#### Resource does not exists

**Condition** : If `id` parameter in the URL specifies a non-existing item.

**Code** : `404 Not Found`

**Content** :

```json
{
  "error": "Resource with the specified 'id' was not found.",
  "code": "RESOURCE_NOT_FOUND"
}
```

---

## Login Endpoint

Used to create a JWT token that can be used to call the `/api/country` endpoints. Token is returned on the `Authorization` response header.

**URL** : `/api/login`

**Header constraints**:

- `Client-Id`: An arbitrary `string` that is a constant for the client where the request initiates from. (e.g.: coding-tasks-web)
- `Authorization`: For passing the username and password used to create the user. It follows the format of the [HTTP Basic Acccess authentication](https://en.wikipedia.org/wiki/Basic_access_authentication) (e.g.: `Authorization: Basic Base64(username:password)`)

**Method** : `POST`

**Auth required** : NO<br>

### Success Response

**Code** : `200 OK`

**Content example**

```json
{
  "data": {
    "id": "nQcWnH1d",
    "username": "andrewszucs"
  }
}
```

**Response header example**

```json
{
  "Authorization": "<created JWT token>"
}
```

### Errors

#### Missing Client-Id header

**Condition** : If `Client-Id` header does not exist.

**Code** : `400 Bad Request`

**Content** :

```json
{
  "error": "Please specify the \"Client-Id\" header!",
  "code": "MISSING_CLIENT_ID"
}
```

#### Missing Authorization header

**Condition** : If `Authorization` header does not exist or it does not match Basci access auth.

**Code** : `400 Bad Request`

**Content** :

```json
{
  "error": "Please specify the login credentials in the Authorization header like so: 'Basic {Base64(username:password)}'!",
  "code": "WRONG_LOGIN_REQUEST"
}
```

#### Incorrect password

**Condition** : If the password specified in the `Authorization` header is incorrect.

**Code** : `401 Unauthorized`

**Content** :

```json
{
  "error": "The username or password was incorrect.",
  "code": "INCORRECT_USERNAME_OR_PASSWORD"
}
```

---

## Country Search Endpoint

Used to search for countries with their names

**URL** : `/api/country?search=...`

**Header constraints**:

- `Authorization`: For passing a valid JWT token. (e.g.: `Authorization: Bearer <JWT token>`)

**Method** : `GET`

**Auth required** : YES, JWT token<br>

### Success Response

**Code** : `200 OK`

**Content example**

```json
{
  "result": [
    {
      "name": "Hungary",
      "alpha3Code": "HUN",
      "flag": "https://restcountries.eu/data/hun.svg"
    }
  ]
}
```

OR

```json
{
  "result": []
}
```

### Errors

#### Missing token

**Condition** : If `Authorization` header does not exist.

**Code** : `400 Bad Request`

**Content** :

```json
{
  "error": "Please specify the API token in the Authorization header like so: 'Bearer {API_TOKEN}'",
  "code": "MISSING_TOKEN"
}
```

#### Invalid token

**Condition** : If the token from `Authorization` could not be verified .

**Code** : `401 Unauthorized`

**Content** :

```json
{
  "error": "The passed API token was invalid",
  "code": "INVALID_TOKEN"
}
```

#### Wrong Request

**Condition** : If `?search` query param is empty or emitted.

**Code** : `400 Bad Request`

**Content** :

```json
{
  "error": "Please specify the query parameter 'search' on the request!",
  "code": "MISSING_SEARCH_PARAM"
}
```

---

## Country Details Endpoint

Used to query country details and currency exchange rate by the `alpha3Code`.

**URL** : `/api/country/:code`

**Header constraints**:

- `Authorization`: For passing a valid JWT token. (e.g.: `Authorization: Bearer <JWT token>`)

**Method** : `GET`

**Auth required** : YES, JWT token<br>

**Rate limit** : 30 requests per minute per token

### Success Response

**Code** : `200 OK`

**Content example**

```json
{
  "result": {
    "name": "Hungary",
    "alpha3Code": "HUN",
    "flag": "https://restcountries.eu/data/hun.svg",
    "population": 9823000,
    "currencies": [
      {
        "code": "HUF",
        "name": "Hungarian forint",
        "symbol": "Ft",
        "base": "SEK",
        "rate": 31.314880521
      }
    ]
  }
}
```

OR

```json
// Less known currencies are not supported by the API so the exchange rate is returned as null
{
  "result": {
    "name": "Burkina Faso",
    "alpha3Code": "BFA",
    "flag": "https://restcountries.eu/data/bfa.svg",
    "population": 19034397,
    "currencies": [
      {
        "code": "XOF",
        "name": "West African CFA franc",
        "symbol": "Fr",
        "base": "SEK",
        "rate": null
      }
    ]
  }
}
```

OR

```json
{
  "result": null
}
```

### Errors

#### Missing token

**Condition** : If `Authorization` header does not exist.

**Code** : `400 Bad Request`

**Content** :

```json
{
  "error": "Please specify the API token in the Authorization header like so: 'Bearer {API_TOKEN}'",
  "code": "MISSING_TOKEN"
}
```

#### Invalid token

**Condition** : If the token from `Authorization` could not be verified .

**Code** : `401 Unauthorized`

**Content** :

```json
{
  "error": "The passed API token was invalid",
  "code": "INVALID_TOKEN"
}
```

#### Invalid country code

**Condition** : If `:code` resource id can not be found.

**Code** : `404 Not Found`

**Content** :

```json
{
  "error": "Resource with the specified 'id' was not found.",
  "code": "RESOURCE_NOT_FOUND"
}
```
