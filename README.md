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

### `yarn test`

Launches the test runner in the interactive watch mode with the `LOG_LEVEL` set to `none`, so it doesn't log anything apart from test errors.<br />

### `yarn start`

Builds the app for production to the `dist` folder.<br />
Then start the app with the `./dist/index.js` file.
