# Timezone Server

An HTTP Node.js server written in TypeScript that provides current time information for any valid timezone identifier.

## Features

- Single API endpoint: `/time/{timezone}`
- Returns current time as ISO string in the requested timezone
- Validates timezone identifiers using `Intl.DateTimeFormat`
- Proper error handling for invalid timezones
- CORS enabled for cross-origin requests

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server (production mode):
   ```bash
   npm start
   ```

3. Or run in development mode with TypeScript:
   ```bash
   npm run dev
   ```

4. Test the endpoint:
   ```bash
   curl http://localhost:3000/time/Etc/UTC
   curl http://localhost:3000/time/America/New_York
   ```

5. Run the comprehensive demo:
   ```bash
   npm run demo
   # Or in development mode:
   npm run demo:dev
   ```

## Development Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run server in development mode with ts-node
- `npm run demo:dev` - Run demo in development mode
- `npm run clean` - Remove compiled files

## API Endpoint

### GET `/time/{timezone}`

Returns the current time in the specified timezone.

**Parameters:**
- `timezone` (path parameter): A valid IANA timezone identifier

**Response (Success - 200):**
```json
"2024-01-01T12:00:00+00:00"
```

**Response (Error - 400):**
```json
{
  "error": "Invalid timezone",
  "message": "The timezone identifier 'Invalid/Timezone' is not valid",
  "requested_timezone": "Invalid/Timezone"
}
```

## Valid Timezone Examples

- `Etc/UTC`
- `America/New_York`
- `Europe/London`
- `Asia/Tokyo`
- `Australia/Sydney`
- `America/Los_Angeles`
- `Europe/Paris`
- `Asia/Kolkata`
- `Pacific/Honolulu`
- `Africa/Cairo`

## Project Structure

```
├── src/
│   ├── server.ts      # Main TypeScript server file
│   └── demo.ts        # TypeScript demo script
├── dist/              # Compiled JavaScript files (generated)
├── tsconfig.json      # TypeScript configuration
├── package.json       # Project dependencies and scripts
└── README.md          # Project documentation
```

## Server Configuration

- **Port:** 3000 (default)
- **Host:** localhost
- **Method:** GET only
- **Content-Type:** application/json
- **TypeScript:** Compiled to ES2020 JavaScript

## Error Handling

The server handles several error cases:
- Invalid timezone identifiers (400 Bad Request)
- Non-existent endpoints (404 Not Found)
- Server errors (500 Internal Server Error)

## TypeScript Features

- **Strict type checking** with comprehensive type annotations
- **Interface definitions** for request/response objects
- **Proper error handling** with typed error objects
- **Development mode** with ts-node for rapid iteration
- **Source maps** for debugging compiled code
