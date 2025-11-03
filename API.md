# SMO Practice Server API Documentation

This API allows you to programmatically control the SMO Practice Server, including uploading scripts, teleporting Mario, loading stages, and more.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, no authentication is required. The API is intended for local use.

## Endpoints

### GET `/api`

Get API information and available commands.

**Response:**
```json
{
  "name": "SMO Practice Server API",
  "version": "1.0.0",
  "endpoints": { ... },
  "commands": { ... },
  "clientConnected": true,
  "clientAddress": "192.168.1.100",
  "uploadedScripts": ["script1.txt", "script2.txt"]
}
```

---

### POST `/api/execute`

Execute a single command.

**Request Body:**
```json
{
  "command": "string (required)",
  "params": {
    // command-specific parameters
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "result": {
    "command": "commandName",
    // command-specific result data
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

### POST `/api/queue`

Execute multiple commands in sequence.

**Request Body:**
```json
{
  "commands": [
    {
      "command": "string",
      "params": { ... }
    },
    {
      "command": "string",
      "params": { ... }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "totalCommands": 3,
  "successfulCommands": 3,
  "failedCommands": 0,
  "results": [
    {
      "index": 0,
      "success": true,
      "result": { ... }
    }
  ],
  "errors": []
}
```

---

## Available Commands

### 1. Teleport Mario

**Command:** `teleport` or `tp`

Teleport Mario to specific coordinates.

**Parameters:**
- `x` (number, required): X coordinate
- `y` (number, required): Y coordinate
- `z` (number, required): Z coordinate

**Example:**
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "teleport",
    "params": {
      "x": 100.5,
      "y": 200.0,
      "z": 300.75
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "command": "teleport",
    "coordinates": {
      "x": 100.5,
      "y": 200.0,
      "z": 300.75
    }
  }
}
```

---

### 2. Go to Stage

**Command:** `stage` or `go`

Warp to a specific stage.

**Parameters:**
- `stageName` (string, required): Name of the stage
- `scenario` (number, optional): Scenario number (1-15), default: -1
- `entrance` (string, optional): Entrance name, default: "start"
- `startScript` (boolean, optional): Start script after warp, default: false

**Example:**
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "stage",
    "params": {
      "stageName": "CapWorldHomeStage",
      "scenario": 1,
      "entrance": "start",
      "startScript": true
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "command": "stage",
    "stageName": "CapWorldHomeStage",
    "scenario": 1,
    "entrance": "start",
    "startScript": true
  }
}
```

---

### 3. Upload Script

**Command:** `uploadScript`

Upload a TAS script to the server. Supports both `.txt` and `.tsv` file formats. TSV files are automatically converted to TXT format.

**Parameters:**
- `filename` (string, required): Name of the script file (must end in `.txt` or `.tsv`)
- `content` (string, required): Script content
- `includeEmptyLines` (boolean, optional): For TSV files only, include empty frames for proper timing. Default: `true`

**Example (TXT file):**
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "uploadScript",
    "params": {
      "filename": "myScript.txt",
      "content": "1 KEY_A 0;0 0;0\n2 KEY_B 1000;500 0;0"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "command": "uploadScript",
    "filename": "myScript.txt",
    "converted": false,
    "originalFormat": "txt"
  }
}
```

**Example (TSV file):**
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "uploadScript",
    "params": {
      "filename": "myScript.tsv",
      "content": "1\tKEY_A\t0;0\t0;0\n5\tKEY_B\t1000;500\t0;0",
      "includeEmptyLines": true
    }
  }'
```

**Response (TSV converted):**
```json
{
  "success": true,
  "result": {
    "command": "uploadScript",
    "filename": "myScript.tsv",
    "converted": true,
    "originalFormat": "tsv"
  }
}
```

**Note:** TSV files are automatically detected by the `.tsv` extension and converted to TXT format. The converted content is stored under the original filename, so you can load it using the same filename.

---

### 4. Load Script

**Command:** `loadScript` or `script`

Load a previously uploaded script to the Switch.

**Parameters:**
- `filename` (string, required): Name of the script file

**Example:**
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "loadScript",
    "params": {
      "filename": "myScript.txt"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "command": "loadScript",
    "filename": "myScript.txt",
    "frames": 150
  }
}
```

---

### 5. Delete Script

**Command:** `deleteScript`

Delete a script from the server.

**Parameters:**
- `filename` (string, required): Name of the script file

**Example:**
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "deleteScript",
    "params": {
      "filename": "oldScript.txt"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "command": "deleteScript",
    "filename": "oldScript.txt"
  }
}
```

---

### 6. Start Script Playback

**Command:** `startScript` or `start`

Start playing the loaded TAS script.

**Parameters:** None

**Example:**
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "startScript"
  }'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "command": "startScript"
  }
}
```

---

### 7. Stop Script Playback

**Command:** `stopScript` or `stop`

Stop the currently playing TAS script.

**Parameters:** None

**Example:**
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "stopScript"
  }'
```

---

### 8. D-Pad Navigation

**Command:** `up`, `down`, `left`, or `right`

Simulate D-Pad button presses for UI navigation.

**Parameters:** None

**Example:**
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "up"
  }'
```

---

### 9. Select Menu Page

**Command:** `select`

Select a specific menu page.

**Parameters:**
- `index` (number, required): Page index (0-indexed)

**Example:**
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "select",
    "params": {
      "index": 5
    }
  }'
```

---

## Queue Multiple Commands

You can execute multiple commands in sequence using the `/api/queue` endpoint. This is useful for complex workflows.

### Example: Delete Old Script, Upload New Script, Load Stage with Script

```bash
curl -X POST http://localhost:3000/api/queue \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {
        "command": "deleteScript",
        "params": {
          "filename": "oldScript.txt"
        }
      },
      {
        "command": "uploadScript",
        "params": {
          "filename": "newScript.txt",
          "content": "1 KEY_A 0;0 0;0\n2 KEY_B 1000;500 0;0\n3 KEY_A;KEY_B 0;0 0;0"
        }
      },
      {
        "command": "loadScript",
        "params": {
          "filename": "newScript.txt"
        }
      },
      {
        "command": "stage",
        "params": {
          "stageName": "CapWorldHomeStage",
          "scenario": 1,
          "startScript": true
        }
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "totalCommands": 4,
  "successfulCommands": 4,
  "failedCommands": 0,
  "results": [
    {
      "index": 0,
      "success": true,
      "result": {
        "command": "deleteScript",
        "filename": "oldScript.txt"
      }
    },
    {
      "index": 1,
      "success": true,
      "result": {
        "command": "uploadScript",
        "filename": "newScript.txt"
      }
    },
    {
      "index": 2,
      "success": true,
      "result": {
        "command": "loadScript",
        "filename": "newScript.txt",
        "frames": 3
      }
    },
    {
      "index": 3,
      "success": true,
      "result": {
        "command": "stage",
        "stageName": "CapWorldHomeStage",
        "scenario": 1,
        "entrance": "start",
        "startScript": true
      }
    }
  ]
}
```

---

## Error Handling

All errors return appropriate HTTP status codes and JSON error messages:

**400 Bad Request:**
```json
{
  "success": false,
  "error": "command is required"
}
```

**Example Errors:**
- `"No Switch client connected"` - The Switch is not connected to the server
- `"Script 'filename.txt' not found"` - The requested script doesn't exist
- `"Stage 'InvalidStage' not found in stage list"` - Invalid stage name
- `"Invalid coordinates: x, y, z must be numbers"` - Invalid parameter types