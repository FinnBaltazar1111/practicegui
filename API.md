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

---

## JavaScript/Node.js Example

```javascript
const axios = require('axios');

async function loadScriptAndPlay() {
  try {
    // Upload a new script
    await axios.post('http://localhost:3000/api/execute', {
      command: 'uploadScript',
      params: {
        filename: 'test.txt',
        content: '1 KEY_A 0;0 0;0\n2 KEY_B 1000;500 0;0'
      }
    });

    // Load the script
    await axios.post('http://localhost:3000/api/execute', {
      command: 'loadScript',
      params: {
        filename: 'test.txt'
      }
    });

    // Go to stage and start the script
    await axios.post('http://localhost:3000/api/execute', {
      command: 'stage',
      params: {
        stageName: 'CapWorldHomeStage',
        startScript: true
      }
    });

    console.log('Script loaded and started!');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

loadScriptAndPlay();
```

---

## Python Example

```python
import requests
import json

def load_script_and_play():
    base_url = 'http://localhost:3000/api'

    try:
        # Upload a new script
        response = requests.post(f'{base_url}/execute', json={
            'command': 'uploadScript',
            'params': {
                'filename': 'test.txt',
                'content': '1 KEY_A 0;0 0;0\n2 KEY_B 1000;500 0;0'
            }
        })
        response.raise_for_status()

        # Load the script
        response = requests.post(f'{base_url}/execute', json={
            'command': 'loadScript',
            'params': {
                'filename': 'test.txt'
            }
        })
        response.raise_for_status()

        # Go to stage and start the script
        response = requests.post(f'{base_url}/execute', json={
            'command': 'stage',
            'params': {
                'stageName': 'CapWorldHomeStage',
                'startScript': True
            }
        })
        response.raise_for_status()

        print('Script loaded and started!')

    except requests.exceptions.RequestException as e:
        print(f'Error: {e}')

load_script_and_play()
```

---

## Google Apps Script Example (for Google Sheets integration)

### Method 1: Convert to TXT format

```javascript
function loadScriptFromSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var scriptData = sheet.getRange('A1:D100').getValues();

  // Convert spreadsheet data to TAS script format (TXT)
  var scriptContent = '';
  for (var i = 0; i < scriptData.length; i++) {
    if (scriptData[i][0]) {
      var frame = scriptData[i][0];
      var buttons = scriptData[i][1] || '';
      var lStick = scriptData[i][2] || '0;0';
      var rStick = scriptData[i][3] || '0;0';
      scriptContent += frame + ' ' + buttons + ' ' + lStick + ' ' + rStick + '\n';
    }
  }

  // Send to API
  var url = 'http://localhost:3000/api/queue';
  var payload = {
    commands: [
      {
        command: 'uploadScript',
        params: {
          filename: 'sheet_script.txt',
          content: scriptContent
        }
      },
      {
        command: 'loadScript',
        params: {
          filename: 'sheet_script.txt'
        }
      },
      {
        command: 'stage',
        params: {
          stageName: 'CapWorldHomeStage',
          startScript: true
        }
      }
    ]
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());

    if (result.success) {
      SpreadsheetApp.getUi().alert('Script loaded successfully!');
    } else {
      SpreadsheetApp.getUi().alert('Error: ' + JSON.stringify(result.errors));
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert('Error connecting to server: ' + e.message);
  }
}
```

### Method 2: Use TSV format (Simpler - Auto-converted by API)

```javascript
function loadScriptFromSheetTSV() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var scriptData = sheet.getRange('A1:D100').getValues();

  // Convert spreadsheet data to TSV format (tab-separated)
  var scriptContent = '';
  for (var i = 0; i < scriptData.length; i++) {
    if (scriptData[i][0]) {
      var frame = scriptData[i][0];
      var buttons = scriptData[i][1] || '';
      var lStick = scriptData[i][2] || '0;0';
      var rStick = scriptData[i][3] || '0;0';
      // Use tabs to separate columns
      scriptContent += frame + '\t' + buttons + '\t' + lStick + '\t' + rStick + '\n';
    }
  }

  // Send to API with .tsv extension - will be auto-converted
  var url = 'http://localhost:3000/api/queue';
  var payload = {
    commands: [
      {
        command: 'uploadScript',
        params: {
          filename: 'sheet_script.tsv',  // Use .tsv extension
          content: scriptContent,
          includeEmptyLines: true  // Fill gaps between frames
        }
      },
      {
        command: 'loadScript',
        params: {
          filename: 'sheet_script.tsv'
        }
      },
      {
        command: 'stage',
        params: {
          stageName: 'CapWorldHomeStage',
          startScript: true
        }
      }
    ]
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());

    if (result.success) {
      // Check if conversion happened
      var uploadResult = result.results[0].result;
      var message = 'Script loaded successfully!';
      if (uploadResult.converted) {
        message += '\n(TSV file was automatically converted to TXT format)';
      }
      SpreadsheetApp.getUi().alert(message);
    } else {
      SpreadsheetApp.getUi().alert('Error: ' + JSON.stringify(result.errors));
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert('Error connecting to server: ' + e.message);
  }
}
```

**Benefits of Method 2 (TSV):**
- Simpler format (tabs instead of spaces)
- Automatic conversion by the API
- `includeEmptyLines` parameter fills frame gaps automatically
- Less manual string formatting required

---

## Script Format Reference

### TXT Format
TAS scripts in TXT format use the following structure:
```
[frame] [buttons] [lStick] [rStick]
```

**Example:**
```
1 KEY_A 0;0 0;0
2 KEY_B 1000;500 0;0
3 KEY_A;KEY_B 0;0 -1000;2000
```

### TSV Format
TSV (Tab-Separated Values) format uses tabs to separate columns:
```
[frame]	[buttons]	[lStick]	[rStick]
```

**Example:**
```
1	KEY_A	0;0	0;0
5	KEY_B	1000;500	0;0
10	KEY_A;KEY_B	0;0	-1000;2000
```

**TSV Conversion:**
- TSV files are automatically converted to TXT format when uploaded via the API
- The `includeEmptyLines` parameter (default: `true`) determines whether empty frames are inserted between non-consecutive frame numbers
- With `includeEmptyLines: true`, frames 2, 3, 4 would be auto-filled between frame 1 and frame 5
- With `includeEmptyLines: false`, only the specified frames are included

## Notes

- The Switch must be connected to the server for most commands to work (except `uploadScript` and `deleteScript`)
- Commands are executed sequentially when using `/api/queue`
- If a command in the queue fails, subsequent commands will still be attempted
- Script content must follow the TAS script format (see Script Format Reference above)
- TSV files are automatically converted to TXT format based on the file extension (`.tsv`)
- Stage names must match exactly (case-sensitive)

---

## Rate Limiting

Currently, there is no rate limiting. However, be mindful that UDP packets are sent with a 32ms delay between them, so large scripts may take time to load.
