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

## Open Endpoints

Open endpoints require no Authentication.

### Encrypted items routes:

Implementation in:

```
./src/app/encrypted
```

Lets you store and retrieve an arbitrary JSON or string in the DB in an encrypted form.

- [Storing Endpoint](#storing-endpoint): `POST /encrypted/items/:id`
- [Retrieval Endpoint](#retrieval-endpoint): `GET /encrypted/items/:id`

---

#### Storing Endpoint

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

## Success Response

**Code** : `200 OK`

**Content example**

```json
{
  "id": "1",
  "result": "success"
}
```

## Errors

### Missing encryption key

**Condition** : If `Authorization` header does not exist.

**Code** : `401 Unauthorized`

**Content** :

```json
{
  "error": "Please specify the encryption key in the Authorization header!",
  "code": "MISSING_ENCRYPTION_KEY"
}
```

### Wrong request body

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

#### Retrieval Endpoint

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

## Success Response

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

## Errors

### Missing decryption key

**Condition** : If `Authorization` header does not exist.

**Code** : `401 Unauthorized`

**Content** :

```json
{
  "error": "Please specify the decryption key in the Authorization header!",
  "code": "MISSING_DECRYPTION_KEY"
}
```

### Resource does not exists

**Condition** : If `id` parameter in the URL specifies a non-existing item.

**Code** : `404 Not Found`

**Content** :

```json
{
  "error": "Resource with the specified 'id' was not found.",
  "code": "RESOURCE_NOT_FOUND"
}
```
