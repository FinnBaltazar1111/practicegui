const dgram = require('dgram');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const multer = require('multer');
const path = require('path');
const { TSVConverter } = require('./tsv-tas');

// Configuration
const CLIENT_PORT = 7901;
const SERVER_PORT = 7902;
const WEB_PORT = 3000;

// Packet types
const OutPacketType = {
  PlayerScriptInfo: 1,
  PlayerScriptData: 2,
  PlayerTeleport: 3,
  PlayerGo: 4,
  ChangePage: 5,
  UINavigation: 6,
  PlayerScriptState: 7
};

const InPacketType = {
  Init: 254,  // -2 as unsigned byte (0xFE)
  Log: 253    // -3 as unsigned byte (0xFD)
};

// Server state
let clientAddress = null;
let clientPort = CLIENT_PORT;
let udpServer = null;
let uploadedScripts = new Map(); // filename -> script content

// Stage list
const STAGES = ["AnimalChaseExStage", "BikeSteelExStage", "BikeSteelNoCapExStage", "BossRaidWorldHomeStage", "BullRunExStage", "ByugoPuzzleExStage", "CapAppearExStage", "CapAppearLavaLiftExStage", "CapRotatePackunExStage", "CapWorldHomeStage", "CapWorldTowerStage", "CityPeopleRoadStage", "CityWorld2DSign000Zone", "CityWorld2DSign001Zone", "CityWorld2DSign002Zone", "CityWorld2DSign003Zone", "CityWorld2DSign004Zone", "CityWorld2DSign005Zone", "CityWorld2DSign006Zone", "CityWorldFactory01Zone", "CityWorldFactoryStage", "CityWorldHomeStage", "CityWorldMainTowerStage", "CityWorldSandSlotStage", "CityWorldShop01Stage", "CityWorldTimerAthletic000Zone", "CityWorldTimerAthletic002Zone", "CityWorldTimerAthletic003Zone", "ClashWorldHomeStage", "ClashWorldShopStage", "CloudExStage", "CloudWorldHomeStage", "Cube2DExStage", "DemoBossRaidAttackStage", "DemoChangeWorldBossRaidAttackStage", "DemoChangeWorldFindKoopaShipStage", "DemoChangeWorldStage", "DemoCrashHomeFallStage", "DemoCrashHomeStage", "DemoEndingStage", "DemoHackFirstStage", "DemoHackKoopaStage", "DemoLavaWorldScenario1EndStage", "DemoMeetCapNpcSubStage", "DemoOpeningStage", "DemoStartWorldWaterfallStage", "DemoTakeOffKoopaForMoonStage", "DemoWorldMoveBackwardArriveStage", "DemoWorldMoveBackwardStage", "DemoWorldMoveForwardArriveStage", "DemoWorldMoveForwardFirstStage", "DemoWorldMoveForwardStage", "DemoWorldMoveMoonBackwardStage", "DemoWorldMoveMoonForwardFirstStage", "DemoWorldMoveMoonForwardStage", "DemoWorldWarpHoleStage", "DonsukeExStage", "DotHardExStage", "DotTowerExStage", "ElectricWireExStage", "FastenerExStage", "FogMountainExStage", "ForestWorld2DRoadZone", "ForestWorldAthleticZone", "ForestWorldBonusStage", "ForestWorldBossStage", "ForestWorldCloudBonusExStage", "ForestWorldHomeStage", "ForestWorldTimerAthletic001Zone", "ForestWorldTowerStage", "ForestWorldWaterExStage", "ForestWorldWoodsCostumeStage", "ForestWorldWoodsStage", "ForestWorldWoodsTreasureStage", "ForkExStage", "FrogPoisonExStage", "FrogSearchExStage", "FukuwaraiKuriboStage", "FukuwaraiMarioStage", "GabuzouClockExStage", "Galaxy2DExStage", "GotogotonExStage", "HomeShipInsideStage", "IceWalkerExStage", "IceWaterBlockExStage", "IceWaterDashExStage", "ImomuPoisonExStage", "JangoExStage", "JizoSwitchExStage", "KaronWingTowerStage", "KillerRailCollisionExStage", "KillerRoadExStage", "KillerRoadNoCapExStage", "LakeWorld2DZone", "LakeWorldHomeStage", "LakeWorldShopStage", "LakeWorldTimerAthletic000Zone", "LakeWorldTownZone", "LavaBonus1Zone", "LavaWorldBubbleLaneExStage", "LavaWorldCaveZone", "LavaWorldClockExStage", "LavaWorldCostumeStage", "LavaWorldExcavationExStage", "LavaWorldFenceLiftExStage", "LavaWorldHomeStage", "LavaWorldIslandZone", "LavaWorldShopStage", "LavaWorldTimerAthletic000Zone", "LavaWorldTimerAthletic001Zone", "LavaWorldTreasureStage", "LavaWorldUpDownExStage", "LavaWorldUpDownYoshiExStage", "Lift2DExStage", "MeganeLiftExStage", "MoonAthleticExStage", "MoonWorldBasement000Zone", "MoonWorldBasement001Zone", "MoonWorldBasement002Zone", "MoonWorldBasement003Zone", "MoonWorldBasement004Zone", "MoonWorldBasementStage", "MoonWorldCaptureParadeBullZone", "MoonWorldCaptureParadeKillerZone", "MoonWorldCaptureParadeLavaPillarZone", "MoonWorldCaptureParadeLiftZone", "MoonWorldCaptureParadeMeganeZone", "MoonWorldCaptureParadeStage", "MoonWorldHome2DZone", "MoonWorldHomeStage", "MoonWorldKoopa1Stage", "MoonWorldKoopa2Stage", "MoonWorldShopRoom", "MoonWorldSphinxRoom", "MoonWorldWeddingRoom2Stage", "MoonWorldWeddingRoomStage", "MoonWorldWeddingRoomZone", "Note2D3DRoomExStage", "PackunPoisonExStage", "PackunPoisonNoCapExStage", "PeachWorldCastleStage", "PeachWorldCostumeStage", "PeachWorldHomeStage", "PeachWorldPictureBossForestStage", "PeachWorldPictureBossKnuckleStage", "PeachWorldPictureBossMagmaStage", "PeachWorldPictureBossRaidStage", "PeachWorldPictureGiantWanderBossStage", "PeachWorldPictureMofumofuStage", "PeachWorldPictureRoomDokanZone", "PeachWorldPictureRoomZone", "PeachWorldShopStage", "PoisonWaveExStage", "PoleGrabCeilExStage", "PoleKillerExStage", "PushBlockExStage", "RadioControlExStage", "RailCollisionExStage", "ReflectBombExStage", "RevengeBossKnuckleStage", "RevengeBossMagmaStage", "RevengeBossRaidStage", "RevengeForestBossStage", "RevengeGiantWanderBossStage", "RevengeMofumofuStage", "RocketFlowerExStage", "RollingExStage", "SandWorldCostumeStage", "SandWorldHomeStage", "SandWorldHomeTownZone", "SandWorldKillerExStage", "SandWorldKillerTowerZone", "SandWorldMeganeExStage", "SandWorldPressExStage", "SandWorldPyramid000Stage", "SandWorldPyramid001Stage", "SandWorldRotateExStage", "SandWorldSecretStage", "SandWorldShopStage", "SandWorldSlotStage", "SandWorldSphinxExStage", "SandWorldUnderground000Stage", "SandWorldUnderground001Stage", "SandWorldVibrationStage", "SeaWorld2DLargeZone", "SeaWorld2DSmallZone", "SeaWorldBeachVolleyBallZone", "SeaWorldBottomHollowZone", "SeaWorldCostumeStage", "SeaWorldCoveCaveZone", "SeaWorldDamageBallZone", "SeaWorldHomeStage", "SeaWorldLavaZone", "SeaWorldLighthouseZone", "SeaWorldLongReefZone", "SeaWorldSecretStage", "SeaWorldSneakingManStage", "SeaWorldSphinxQuizZone", "SeaWorldUnderGlassZone", "SeaWorldUtsuboCaveStage", "SeaWorldUtsuboDenZone", "SeaWorldVibrationStage", "SeaWorldWallCaveCenterZone", "SeaWorldWallCaveWestZone", "SenobiTowerExStage", "SenobiTowerYoshiExStage", "ShootingCityExStage", "ShootingCityYoshiExStage", "ShootingElevatorExStage", "SkyWorldCastleZone", "SkyWorldCloudBonusExStage", "SkyWorldCostumeStage", "SkyWorldHomeStage", "SkyWorldShopStage", "SkyWorldTreasureStage", "SkyWorldWallZone", "SnowWorldBalconyZone", "SnowWorldByugoZone", "SnowWorldCloudBonusExStage", "SnowWorldCostumeStage", "SnowWorldGabuzouZone", "SnowWorldHomeStage", "SnowWorldIcicleZone", "SnowWorldLobby000Stage", "SnowWorldLobby001Stage", "SnowWorldLobbyExStage", "SnowWorldRace000Stage", "SnowWorldRace001Stage", "SnowWorldRaceCircuitZone", "SnowWorldRaceExStage", "SnowWorldRaceExZone", "SnowWorldRaceFlagZone", "SnowWorldRaceGroundZone", "SnowWorldRaceHardExStage", "SnowWorldRaceObjectZone", "SnowWorldRaceTutorialStage", "SnowWorldShopStage", "SnowWorldTownStage", "SnowWorldTownZone", "Special1WorldHomeStage", "Special1WorldTowerBombTailStage", "Special1WorldTowerCapThrowerStage", "Special1WorldTowerFireBlowerStage", "Special1WorldTowerRoomZone", "Special1WorldTowerStackerStage", "Special2WorldCloudStage", "Special2WorldHomeStage", "Special2WorldKoopaStage", "Special2WorldLavaStage", "StaffRollMoonRockDemo", "SwingSteelExStage", "Theater2DExStage", "TogezoRotateExStage", "TrampolineWallCatchExStage", "TrexBikeExStage", "TrexPoppunExStage", "TsukkunClimbExStage", "TsukkunRotateExStage", "WanwanClashExStage", "WaterTubeExStage", "WaterValleyExStage", "WaterfallWorldHomeStage", "WindBlowExStage", "WorldMapStage", "YoshiCloudExStage"];

// Byte conversion utilities
function floatToBytes(value) {
  const buf = Buffer.allocUnsafe(4);
  buf.writeFloatLE(value, 0);
  return buf;
}

function intToBytes(value) {
  const buf = Buffer.allocUnsafe(4);
  buf.writeInt32LE(value, 0);
  return buf;
}

function longToBytes(value) {
  const buf = Buffer.allocUnsafe(8);
  buf.writeBigInt64LE(BigInt(value), 0);
  return buf;
}

function booleansToByte(bools) {
  let byte = 0;
  for (let i = 0; i < Math.min(8, bools.length); i++) {
    if (bools[i]) byte |= (1 << i);
  }
  return byte;
}

// Packet builders
function buildPacket(type, data) {
  return Buffer.concat([Buffer.from([type]), data]);
}

function buildTeleportPacket(x, y, z) {
  const data = Buffer.concat([
    floatToBytes(x),
    floatToBytes(y),
    floatToBytes(z)
  ]);
  return buildPacket(OutPacketType.PlayerTeleport, data);
}

function buildGoPacket(stageName, scenario, entrance, startScript) {
  const stageBytes = Buffer.from(stageName, 'utf8');
  const entranceBytes = Buffer.from(entrance, 'utf8');
  const data = Buffer.concat([
    Buffer.from([scenario, stageBytes.length, entranceBytes.length]),
    stageBytes,
    entranceBytes,
    Buffer.from([startScript ? 1 : 0])
  ]);
  return buildPacket(OutPacketType.PlayerGo, data);
}

function buildSelectPacket(index) {
  return buildPacket(OutPacketType.ChangePage, Buffer.from([index]));
}

function buildUINavigationPacket(direction) {
  const values = {
    left: 1 << 12,
    up: 1 << 13,
    right: 1 << 14,
    down: 1 << 15
  };
  return buildPacket(OutPacketType.UINavigation, longToBytes(values[direction]));
}

function buildScriptStatePacket(state) {
  return buildPacket(OutPacketType.PlayerScriptState, Buffer.from([state]));
}

function parseScriptFile(content) {
  const lines = content.split('\n');
  const frames = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.trim().split(' ');
    if (parts.length < 4) continue;
    
    const frameNo = parseInt(parts[0]);
    const buttons = parts[1].split(';');
    const lStick = parts[2].split(';').map(v => parseInt(v) / 32767.0);
    const rStick = parts[3].split(';').map(v => parseInt(v) / 32767.0);
    
    // Fill empty frames if needed
    while (frames.length < frameNo) {
      frames.push(createEmptyFrame());
    }
    
    const frame = {
      lStick: { x: lStick[0] || 0, y: lStick[1] || 0 },
      rStick: { x: rStick[0] || 0, y: rStick[1] || 0 },
      a: false, b: false, x: false, y: false,
      l: false, r: false, zl: false, zr: false,
      plus: false, minus: false,
      triggerLStick: false, triggerRStick: false,
      dUp: false, dRight: false, dDown: false, dLeft: false
    };
    
    for (const button of buttons) {
      switch (button) {
        case 'KEY_A': frame.a = true; break;
        case 'KEY_B': frame.b = true; break;
        case 'KEY_X': frame.x = true; break;
        case 'KEY_Y': frame.y = true; break;
        case 'KEY_ZR': frame.zr = true; break;
        case 'KEY_ZL': frame.zl = true; break;
        case 'KEY_R': frame.r = true; break;
        case 'KEY_L': frame.l = true; break;
        case 'KEY_PLUS': frame.plus = true; break;
        case 'KEY_MINUS': frame.minus = true; break;
        case 'KEY_DLEFT': frame.dLeft = true; break;
        case 'KEY_DRIGHT': frame.dRight = true; break;
        case 'KEY_DUP': frame.dUp = true; break;
        case 'KEY_DDOWN': frame.dDown = true; break;
        case 'KEY_LSTICK': frame.triggerLStick = true; break;
        case 'KEY_RSTICK': frame.triggerRStick = true; break;
      }
    }
    
    frames.push(frame);
  }
  
  return frames;
}

function createEmptyFrame() {
  return {
    lStick: { x: 0, y: 0 },
    rStick: { x: 0, y: 0 },
    a: false, b: false, x: false, y: false,
    l: false, r: false, zl: false, zr: false,
    plus: false, minus: false,
    triggerLStick: false, triggerRStick: false,
    dUp: false, dRight: false, dDown: false, dLeft: false
  };
}

function frameToBytes(frame) {
  const lStickX = floatToBytes(frame.lStick.x);
  const lStickY = floatToBytes(frame.lStick.y);
  const rStickX = floatToBytes(frame.rStick.x);
  const rStickY = floatToBytes(frame.rStick.y);
  
  const buttons1 = booleansToByte([
    frame.a, frame.b, frame.x, frame.y,
    frame.l, frame.r, frame.zl, frame.zr
  ]);
  
  const buttons2 = booleansToByte([
    frame.plus, frame.minus, frame.triggerLStick, frame.triggerRStick,
    frame.dUp, frame.dRight, frame.dDown, frame.dLeft
  ]);
  
  return Buffer.concat([
    lStickX, lStickY, rStickX, rStickY,
    Buffer.from([buttons1, buttons2, 0, 0]) // padding to 0x20
  ]);
}

function buildScriptPackets(scriptName, frames) {
  const packets = [];
  
  // Send script info
  const nameBytes = Buffer.from(scriptName, 'utf8');
  packets.push(buildPacket(OutPacketType.PlayerScriptInfo, nameBytes));
  
  // Send frames in chunks of 1500
  for (let i = 0; i < frames.length; i += 1500) {
    const chunk = frames.slice(i, i + 1500);
    const frameData = Buffer.concat(chunk.map(frameToBytes));
    packets.push(buildPacket(OutPacketType.PlayerScriptData, frameData));
  }
  
  return packets;
}

// UDP Server
function startUDPServer() {
  udpServer = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  
  udpServer.on('message', (msg, rinfo) => {
    console.log(`Received ${msg.length} bytes from ${rinfo.address}:${rinfo.port}`);
    console.log(`Raw data: ${Array.from(msg).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
    
    if (msg.length === 0) return;
    
    const packetType = msg[0];
    console.log(`Packet type: ${packetType}`);
    
    if (packetType === InPacketType.Init) {
      clientAddress = rinfo.address;
      clientPort = rinfo.port; // Use the port the client sent from
      console.log(`✓ Client connected from ${clientAddress}:${clientPort}`);
      io.emit('clientStatus', { connected: true, address: clientAddress });
    } else if (packetType === InPacketType.Log) {
      const logMessage = msg.slice(1).toString('utf8');
      console.log(`[Switch Log]: ${logMessage}`);
      io.emit('log', logMessage);
    } else {
      console.log(`Received unknown packet type: ${packetType}`);
    }
  });
  
  udpServer.on('error', (err) => {
    console.error('UDP Server error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ ERROR: Port ${SERVER_PORT} is already in use!`);
      console.error('Make sure the Java server is NOT running.');
      console.error('On Linux/Mac: Check with: lsof -i :${SERVER_PORT}');
      console.error('On Windows: Check with: netstat -ano | findstr :${SERVER_PORT}\n');
      process.exit(1);
    }
    udpServer.close();
  });
  
  udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log(`UDP Server listening on ${address.address}:${address.port}`);
  });
  
  udpServer.bind(SERVER_PORT, '0.0.0.0');
}

function sendPacket(packet) {
  return new Promise((resolve, reject) => {
    if (!clientAddress) {
      reject(new Error('No client connected'));
      return;
    }
    
    udpServer.send(packet, CLIENT_PORT, clientAddress, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function sendPackets(packets) {
  for (const packet of packets) {
    await sendPacket(packet);
    await new Promise(resolve => setTimeout(resolve, 32));
  }
}

// Web Server
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(getHTML());
});

app.post('/upload-script', upload.single('script'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filename = req.file.originalname;
  const content = req.file.buffer.toString('utf8');
  const isTSV = filename.toLowerCase().endsWith('.tsv');

  uploadedScripts.set(filename, content);
  console.log(`Script uploaded: ${filename}`);

  res.json({ success: true, filename, isTSV });
});

app.post('/convert-tsv', express.json(), (req, res) => {
  try {
    const { filename, includeEmptyLines } = req.body;

    if (!uploadedScripts.has(filename)) {
      return res.status(404).json({ error: 'TSV file not found' });
    }

    const tsvContent = uploadedScripts.get(filename);
    // Default to true - most TAS scripts need all frames for proper timing
    const converter = new TSVConverter(includeEmptyLines !== false);
    const txtContent = converter.convert(tsvContent);

    // Replace the TSV content with the converted TXT content, keeping the original filename
    // This way the user sees the same filename they uploaded, but it contains the converted script
    uploadedScripts.set(filename, txtContent);
    console.log(`Converted ${filename} to TXT format (keeping original filename)`);

    res.json({ success: true, filename, txtContent });
  } catch (err) {
    console.error('TSV conversion error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.get('/scripts', (req, res) => {
  res.json(Array.from(uploadedScripts.keys()));
});

app.get('/client-status', (req, res) => {
  res.json({ connected: !!clientAddress, address: clientAddress });
});

io.on('connection', (socket) => {
  console.log('Web client connected');
  
  socket.emit('clientStatus', { connected: !!clientAddress, address: clientAddress });
  socket.emit('scripts', Array.from(uploadedScripts.keys()));
  
  socket.on('command', async (data) => {
    try {
      if (!clientAddress) {
        socket.emit('error', 'No Switch client connected');
        return;
      }
      
      const { command, params } = data;
      let packets = [];
      
      switch (command) {
        case 'tp':
          packets = [buildTeleportPacket(params.x, params.y, params.z)];
          break;
          
        case 'go':
          if (!STAGES.includes(params.stageName)) {
            socket.emit('error', `Stage "${params.stageName}" not found in stage list`);
            return;
          }
          packets = [buildGoPacket(
            params.stageName,
            params.scenario || -1,
            params.entrance || 'start',
            params.startScript || false
          )];
          break;
          
        case 'script':
          const scriptContent = uploadedScripts.get(params.filename);
          if (!scriptContent) {
            socket.emit('error', 'Script not found');
            return;
          }
          const frames = parseScriptFile(scriptContent);
          packets = buildScriptPackets(params.filename, frames);
          console.log(`Loading script ${params.filename} with ${frames.length} frames`);
          break;
          
        case 'select':
          packets = [buildSelectPacket(params.index)];
          break;
          
        case 'up':
        case 'down':
        case 'left':
        case 'right':
          packets = [buildUINavigationPacket(command)];
          break;
          
        case 'start':
          packets = [buildScriptStatePacket(1)];
          break;
          
        case 'stop':
          packets = [buildScriptStatePacket(0)];
          break;
          
        default:
          socket.emit('error', `Unknown command: ${command}`);
          return;
      }
      
      await sendPackets(packets);
      socket.emit('success', `Command '${command}' sent successfully`);
      
    } catch (err) {
      console.error('Command error:', err);
      socket.emit('error', err.message);
    }
  });
});

function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SMO Practice Server</title>
  <script src="/socket.io/socket.io.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Consolas', 'Monaco', monospace;
      background: #0d1117;
      color: #c9d1d9;
      padding: 20px;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #21262d;
    }
    
    h1 {
      color: #58a6ff;
      font-size: 2em;
      margin-bottom: 10px;
    }
    
    .status {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.9em;
      font-weight: bold;
    }
    
    .status.connected {
      background: #238636;
      color: #fff;
    }
    
    .status.disconnected {
      background: #da3633;
      color: #fff;
    }
    
    .section {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .section h2 {
      color: #58a6ff;
      font-size: 1.3em;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #21262d;
    }
    
    .commands {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }
    
    button {
      background: #21262d;
      color: #c9d1d9;
      border: 1px solid #30363d;
      padding: 10px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.95em;
      transition: all 0.2s;
    }
    
    button:hover:not(:disabled) {
      background: #30363d;
      border-color: #58a6ff;
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .upload-area {
      border: 2px dashed #30363d;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      margin-bottom: 15px;
      transition: all 0.2s;
    }
    
    .upload-area:hover {
      border-color: #58a6ff;
      background: #0d1117;
    }
    
    input[type="file"] {
      display: none;
    }
    
    .upload-btn {
      background: #238636;
      color: #fff;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      display: inline-block;
      margin-top: 10px;
    }
    
    .upload-btn:hover {
      background: #2ea043;
    }
    
    .script-list {
      max-height: 150px;
      overflow-y: auto;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 10px;
    }
    
    .script-item {
      padding: 8px;
      margin: 4px 0;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .script-item:hover {
      background: #21262d;
      border-color: #58a6ff;
    }
    
    .script-item.selected {
      background: #1f6feb;
      border-color: #58a6ff;
      color: #fff;
    }
    
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .modal.active {
      display: flex;
    }
    
    .modal-content {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 25px;
      max-width: 500px;
      width: 90%;
    }
    
    .modal h3 {
      color: #58a6ff;
      margin-bottom: 20px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      color: #8b949e;
      font-size: 0.9em;
    }
    
    input, select {
      width: 100%;
      padding: 8px 12px;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #c9d1d9;
      font-family: inherit;
      font-size: 0.95em;
    }
    
    input:focus, select:focus {
      outline: none;
      border-color: #58a6ff;
    }
    
    .modal-buttons {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }
    
    .btn-primary {
      background: #238636;
      color: #fff;
      border: none;
    }
    
    .btn-primary:hover {
      background: #2ea043;
    }
    
    .btn-secondary {
      background: #21262d;
    }
    
    .log {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 15px;
      max-height: 200px;
      overflow-y: auto;
      font-size: 0.85em;
    }
    
    .log-entry {
      padding: 4px 0;
      border-bottom: 1px solid #21262d;
    }
    
    .log-entry:last-child {
      border-bottom: none;
    }
    
    .log-entry.success {
      color: #3fb950;
    }
    
    .log-entry.error {
      color: #f85149;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🎮 SMO Practice Server</h1>
      <div id="status" class="status disconnected">Disconnected</div>
    </header>
    
    <div class="section">
      <h2>📜 Scripts</h2>
      <div class="upload-area" onclick="document.getElementById('fileInput').click()">
        <div>Drop TAS script files here or click to upload</div>
        <div style="font-size: 0.85em; color: #8b949e; margin-top: 5px;">Supports .txt and .tsv files</div>
        <label class="upload-btn">Choose Files</label>
        <input type="file" id="fileInput" multiple accept=".txt,.tsv">
      </div>
      <div id="scriptList" class="script-list">
        <div style="color: #8b949e; text-align: center;">No scripts uploaded</div>
      </div>
    </div>
    
    <div class="section">
      <h2>⚡ Commands</h2>
      <div class="commands">
        <button onclick="openModal('tp')">Teleport (tp)</button>
        <button onclick="openModal('go')">Go to Stage (go)</button>
        <button onclick="openModal('script')">Load Script</button>
        <button onclick="openModal('select')">Select (select)</button>
        <button onclick="sendCommand('up')">D-Pad Up</button>
        <button onclick="sendCommand('down')">D-Pad Down</button>
        <button onclick="sendCommand('left')">D-Pad Left</button>
        <button onclick="sendCommand('right')">D-Pad Right</button>
        <button onclick="sendCommand('start')">Start TAS</button>
        <button onclick="sendCommand('stop')">Stop TAS</button>
      </div>
    </div>
    
    <div class="section">
      <h2>📋 Log</h2>
      <div id="log" class="log">
        <div class="log-entry">Server started. Waiting for Switch connection...</div>
      </div>
    </div>
  </div>
  
  <!-- Modal for command parameters -->
  <div id="modal" class="modal">
    <div class="modal-content">
      <h3 id="modalTitle">Command</h3>
      <div id="modalBody"></div>
      <div class="modal-buttons">
        <button class="btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn-primary" onclick="submitModal()">Execute</button>
      </div>
    </div>
  </div>

  <!-- Modal for TSV conversion -->
  <div id="tsvModal" class="modal">
    <div class="modal-content">
      <h3>Convert TSV to TXT</h3>
      <div id="tsvModalBody">
        <p>A TSV file has been uploaded. Would you like to convert it to TXT format?</p>
        <div class="form-group">
          <label>
            <input type="checkbox" id="includeEmptyLines" style="width: auto;" checked>
            Include empty frames (recommended for proper timing)
          </label>
        </div>
        <div style="font-size: 0.85em; color: #8b949e; margin-top: 10px;">
          The converted .txt file will be added to your script list automatically.
        </div>
      </div>
      <div class="modal-buttons">
        <button class="btn-secondary" onclick="closeTSVModal()">Skip</button>
        <button class="btn-primary" onclick="convertTSV()">Convert</button>
      </div>
    </div>
  </div>
  
  <script>
    const socket = io();
    let selectedScript = null;
    let currentModal = null;
    let isConnected = false;
    let currentTSVFile = null;
    
    // Socket events
    socket.on('clientStatus', (data) => {
      isConnected = data.connected;
      const statusEl = document.getElementById('status');
      if (data.connected) {
        statusEl.className = 'status connected';
        statusEl.textContent = \`Connected: \${data.address}\`;
        updateButtonStates();
      } else {
        statusEl.className = 'status disconnected';
        statusEl.textContent = 'Disconnected';
        updateButtonStates();
      }
    });
    
    socket.on('scripts', (scripts) => {
      updateScriptList(scripts);
    });
    
    socket.on('success', (msg) => {
      addLog(msg, 'success');
    });
    
    socket.on('error', (msg) => {
      addLog('Error: ' + msg, 'error');
    });
    
    socket.on('log', (msg) => {
      addLog('[Switch]: ' + msg);
    });
    
    // File upload
    document.getElementById('fileInput').addEventListener('change', async (e) => {
      const files = e.target.files;
      for (const file of files) {
        const formData = new FormData();
        formData.append('script', file);

        try {
          const res = await fetch('/upload-script', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.success) {
            addLog(\`Uploaded: \${data.filename}\`, 'success');

            // If TSV file, show conversion modal
            if (data.isTSV) {
              currentTSVFile = data.filename;
              openTSVModal();
            }

            refreshScripts();
          }
        } catch (err) {
          addLog('Upload failed: ' + err.message, 'error');
        }
      }
      e.target.value = '';
    });
    
    async function refreshScripts() {
      const res = await fetch('/scripts');
      const scripts = await res.json();
      updateScriptList(scripts);
    }
    
    function updateScriptList(scripts) {
      const list = document.getElementById('scriptList');
      if (scripts.length === 0) {
        list.innerHTML = '<div style="color: #8b949e; text-align: center;">No scripts uploaded</div>';
        return;
      }
      
      list.innerHTML = scripts.map(s => 
        \`<div class="script-item \${s === selectedScript ? 'selected' : ''}" onclick="selectScript('\${s}')">\${s}</div>\`
      ).join('');
    }
    
    function selectScript(name) {
      selectedScript = name;
      refreshScripts();
    }
    
    function openModal(command) {
      if (!isConnected) {
        addLog('Error: No Switch client connected', 'error');
        return;
      }
      
      currentModal = command;
      const modal = document.getElementById('modal');
      const title = document.getElementById('modalTitle');
      const body = document.getElementById('modalBody');
      
      let html = '';
      
      switch (command) {
        case 'tp':
          title.textContent = 'Teleport Mario';
          html = \`
            <div class="form-group">
              <label>X Coordinate</label>
              <input type="number" step="any" id="param_x" placeholder="100">
            </div>
            <div class="form-group">
              <label>Y Coordinate</label>
              <input type="number" step="any" id="param_y" placeholder="20.4">
            </div>
            <div class="form-group">
              <label>Z Coordinate</label>
              <input type="number" step="any" id="param_z" placeholder="4000">
            </div>
          \`;
          break;
          
        case 'go':
          title.textContent = 'Go to Stage';
          html = \`
            <div class="form-group">
              <label>Stage Name</label>
              <input type="text" id="param_stageName" placeholder="CapWorldHomeStage" list="stageList">
              <datalist id="stageList">
                ${STAGES.map(s => `<option value="${s}">`).join('')}
              </datalist>
            </div>
            <div class="form-group">
              <label>Scenario (1-15, optional)</label>
              <input type="number" id="param_scenario" min="1" max="15" placeholder="Leave empty for default">
            </div>
            <div class="form-group">
              <label>Entrance (optional)</label>
              <input type="text" id="param_entrance" placeholder="start">
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="param_startScript" style="width: auto;">
                Start script after warp
              </label>
            </div>
          \`;
          break;
          
        case 'script':
          title.textContent = 'Load Script';
          if (!selectedScript) {
            html = '<div style="color: #f85149;">Please select a script from the list above first.</div>';
          } else {
            html = \`<div>Load script: <strong>\${selectedScript}</strong></div>\`;
          }
          break;
          
        case 'select':
          title.textContent = 'Select Page';
          html = \`
            <div class="form-group">
              <label>Page Index (0-indexed)</label>
              <input type="number" id="param_index" min="0" placeholder="5">
            </div>
          \`;
          break;
      }
      
      body.innerHTML = html;
      modal.classList.add('active');
    }
    
    function closeModal() {
      document.getElementById('modal').classList.remove('active');
      currentModal = null;
    }
    
    function submitModal() {
      if (!currentModal) return;
      
      let params = {};
      
      switch (currentModal) {
        case 'tp':
          params = {
            x: parseFloat(document.getElementById('param_x').value),
            y: parseFloat(document.getElementById('param_y').value),
            z: parseFloat(document.getElementById('param_z').value)
          };
          if (isNaN(params.x) || isNaN(params.y) || isNaN(params.z)) {
            addLog('Error: Invalid coordinates', 'error');
            return;
          }
          break;
          
        case 'go':
          const stageName = document.getElementById('param_stageName').value.trim();
          if (!stageName) {
            addLog('Error: Stage name is required', 'error');
            return;
          }
          if (!STAGES.includes(stageName)) {
            addLog('Warning: Stage name not in known list', 'error');
          }
          params = {
            stageName,
            scenario: parseInt(document.getElementById('param_scenario').value) || undefined,
            entrance: document.getElementById('param_entrance').value.trim() || undefined,
            startScript: document.getElementById('param_startScript').checked
          };
          break;
          
        case 'script':
          if (!selectedScript) {
            addLog('Error: No script selected', 'error');
            return;
          }
          params = { filename: selectedScript };
          break;
          
        case 'select':
          params = {
            index: parseInt(document.getElementById('param_index').value)
          };
          if (isNaN(params.index) || params.index < 0) {
            addLog('Error: Invalid index', 'error');
            return;
          }
          break;
      }
      
      sendCommand(currentModal, params);
      closeModal();
    }
    
    function sendCommand(command, params = {}) {
      if (!isConnected && command !== 'help') {
        addLog('Error: No Switch client connected', 'error');
        return;
      }
      
      socket.emit('command', { command, params });
    }
    
    function addLog(message, type = '') {
      const log = document.getElementById('log');
      const entry = document.createElement('div');
      entry.className = 'log-entry' + (type ? ' ' + type : '');
      entry.textContent = new Date().toLocaleTimeString() + ' - ' + message;
      log.appendChild(entry);
      log.scrollTop = log.scrollHeight;
    }
    
    function updateButtonStates() {
      const buttons = document.querySelectorAll('.commands button');
      buttons.forEach(btn => {
        btn.disabled = !isConnected;
      });
    }
    
    // TSV Modal functions
    function openTSVModal() {
      document.getElementById('tsvModal').classList.add('active');
    }

    function closeTSVModal() {
      document.getElementById('tsvModal').classList.remove('active');
      currentTSVFile = null;
    }

    async function convertTSV() {
      if (!currentTSVFile) return;

      const includeEmptyLines = document.getElementById('includeEmptyLines').checked;

      try {
        const res = await fetch('/convert-tsv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: currentTSVFile,
            includeEmptyLines
          })
        });

        const data = await res.json();

        if (data.success) {
          addLog(\`Converted \${currentTSVFile} to TXT format\`, 'success');
          refreshScripts();
          closeTSVModal();
        } else {
          addLog('Conversion failed: ' + (data.error || 'Unknown error'), 'error');
        }
      } catch (err) {
        addLog('Conversion failed: ' + err.message, 'error');
      }
    }

    // Stage list for datalist
    const STAGES = ["AnimalChaseExStage", "BikeSteelExStage", "BikeSteelNoCapExStage", "BossRaidWorldHomeStage", "BullRunExStage", "ByugoPuzzleExStage", "CapAppearExStage", "CapAppearLavaLiftExStage", "CapRotatePackunExStage", "CapWorldHomeStage", "CapWorldTowerStage", "CityPeopleRoadStage", "CityWorld2DSign000Zone", "CityWorld2DSign001Zone", "CityWorld2DSign002Zone", "CityWorld2DSign003Zone", "CityWorld2DSign004Zone", "CityWorld2DSign005Zone", "CityWorld2DSign006Zone", "CityWorldFactory01Zone", "CityWorldFactoryStage", "CityWorldHomeStage", "CityWorldMainTowerStage", "CityWorldSandSlotStage", "CityWorldShop01Stage", "CityWorldTimerAthletic000Zone", "CityWorldTimerAthletic002Zone", "CityWorldTimerAthletic003Zone", "ClashWorldHomeStage", "ClashWorldShopStage", "CloudExStage", "CloudWorldHomeStage", "Cube2DExStage", "DemoBossRaidAttackStage", "DemoChangeWorldBossRaidAttackStage", "DemoChangeWorldFindKoopaShipStage", "DemoChangeWorldStage", "DemoCrashHomeFallStage", "DemoCrashHomeStage", "DemoEndingStage", "DemoHackFirstStage", "DemoHackKoopaStage", "DemoLavaWorldScenario1EndStage", "DemoMeetCapNpcSubStage", "DemoOpeningStage", "DemoStartWorldWaterfallStage", "DemoTakeOffKoopaForMoonStage", "DemoWorldMoveBackwardArriveStage", "DemoWorldMoveBackwardStage", "DemoWorldMoveForwardArriveStage", "DemoWorldMoveForwardFirstStage", "DemoWorldMoveForwardStage", "DemoWorldMoveMoonBackwardStage", "DemoWorldMoveMoonForwardFirstStage", "DemoWorldMoveMoonForwardStage", "DemoWorldWarpHoleStage", "DonsukeExStage", "DotHardExStage", "DotTowerExStage", "ElectricWireExStage", "FastenerExStage", "FogMountainExStage", "ForestWorld2DRoadZone", "ForestWorldAthleticZone", "ForestWorldBonusStage", "ForestWorldBossStage", "ForestWorldCloudBonusExStage", "ForestWorldHomeStage", "ForestWorldTimerAthletic001Zone", "ForestWorldTowerStage", "ForestWorldWaterExStage", "ForestWorldWoodsCostumeStage", "ForestWorldWoodsStage", "ForestWorldWoodsTreasureStage", "ForkExStage", "FrogPoisonExStage", "FrogSearchExStage", "FukuwaraiKuriboStage", "FukuwaraiMarioStage", "GabuzouClockExStage", "Galaxy2DExStage", "GotogotonExStage", "HomeShipInsideStage", "IceWalkerExStage", "IceWaterBlockExStage", "IceWaterDashExStage", "ImomuPoisonExStage", "JangoExStage", "JizoSwitchExStage", "KaronWingTowerStage", "KillerRailCollisionExStage", "KillerRoadExStage", "KillerRoadNoCapExStage", "LakeWorld2DZone", "LakeWorldHomeStage", "LakeWorldShopStage", "LakeWorldTimerAthletic000Zone", "LakeWorldTownZone", "LavaBonus1Zone", "LavaWorldBubbleLaneExStage", "LavaWorldCaveZone", "LavaWorldClockExStage", "LavaWorldCostumeStage", "LavaWorldExcavationExStage", "LavaWorldFenceLiftExStage", "LavaWorldHomeStage", "LavaWorldIslandZone", "LavaWorldShopStage", "LavaWorldTimerAthletic000Zone", "LavaWorldTimerAthletic001Zone", "LavaWorldTreasureStage", "LavaWorldUpDownExStage", "LavaWorldUpDownYoshiExStage", "Lift2DExStage", "MeganeLiftExStage", "MoonAthleticExStage", "MoonWorldBasement000Zone", "MoonWorldBasement001Zone", "MoonWorldBasement002Zone", "MoonWorldBasement003Zone", "MoonWorldBasement004Zone", "MoonWorldBasementStage", "MoonWorldCaptureParadeBullZone", "MoonWorldCaptureParadeKillerZone", "MoonWorldCaptureParadeLavaPillarZone", "MoonWorldCaptureParadeLiftZone", "MoonWorldCaptureParadeMeganeZone", "MoonWorldCaptureParadeStage", "MoonWorldHome2DZone", "MoonWorldHomeStage", "MoonWorldKoopa1Stage", "MoonWorldKoopa2Stage", "MoonWorldShopRoom", "MoonWorldSphinxRoom", "MoonWorldWeddingRoom2Stage", "MoonWorldWeddingRoomStage", "MoonWorldWeddingRoomZone", "Note2D3DRoomExStage", "PackunPoisonExStage", "PackunPoisonNoCapExStage", "PeachWorldCastleStage", "PeachWorldCostumeStage", "PeachWorldHomeStage", "PeachWorldPictureBossForestStage", "PeachWorldPictureBossKnuckleStage", "PeachWorldPictureBossMagmaStage", "PeachWorldPictureBossRaidStage", "PeachWorldPictureGiantWanderBossStage", "PeachWorldPictureMofumofuStage", "PeachWorldPictureRoomDokanZone", "PeachWorldPictureRoomZone", "PeachWorldShopStage", "PoisonWaveExStage", "PoleGrabCeilExStage", "PoleKillerExStage", "PushBlockExStage", "RadioControlExStage", "RailCollisionExStage", "ReflectBombExStage", "RevengeBossKnuckleStage", "RevengeBossMagmaStage", "RevengeBossRaidStage", "RevengeForestBossStage", "RevengeGiantWanderBossStage", "RevengeMofumofuStage", "RocketFlowerExStage", "RollingExStage", "SandWorldCostumeStage", "SandWorldHomeStage", "SandWorldHomeTownZone", "SandWorldKillerExStage", "SandWorldKillerTowerZone", "SandWorldMeganeExStage", "SandWorldPressExStage", "SandWorldPyramid000Stage", "SandWorldPyramid001Stage", "SandWorldRotateExStage", "SandWorldSecretStage", "SandWorldShopStage", "SandWorldSlotStage", "SandWorldSphinxExStage", "SandWorldUnderground000Stage", "SandWorldUnderground001Stage", "SandWorldVibrationStage", "SeaWorld2DLargeZone", "SeaWorld2DSmallZone", "SeaWorldBeachVolleyBallZone", "SeaWorldBottomHollowZone", "SeaWorldCostumeStage", "SeaWorldCoveCaveZone", "SeaWorldDamageBallZone", "SeaWorldHomeStage", "SeaWorldLavaZone", "SeaWorldLighthouseZone", "SeaWorldLongReefZone", "SeaWorldSecretStage", "SeaWorldSneakingManStage", "SeaWorldSphinxQuizZone", "SeaWorldUnderGlassZone", "SeaWorldUtsuboCaveStage", "SeaWorldUtsuboDenZone", "SeaWorldVibrationStage", "SeaWorldWallCaveCenterZone", "SeaWorldWallCaveWestZone", "SenobiTowerExStage", "SenobiTowerYoshiExStage", "ShootingCityExStage", "ShootingCityYoshiExStage", "ShootingElevatorExStage", "SkyWorldCastleZone", "SkyWorldCloudBonusExStage", "SkyWorldCostumeStage", "SkyWorldHomeStage", "SkyWorldShopStage", "SkyWorldTreasureStage", "SkyWorldWallZone", "SnowWorldBalconyZone", "SnowWorldByugoZone", "SnowWorldCloudBonusExStage", "SnowWorldCostumeStage", "SnowWorldGabuzouZone", "SnowWorldHomeStage", "SnowWorldIcicleZone", "SnowWorldLobby000Stage", "SnowWorldLobby001Stage", "SnowWorldLobbyExStage", "SnowWorldRace000Stage", "SnowWorldRace001Stage", "SnowWorldRaceCircuitZone", "SnowWorldRaceExStage", "SnowWorldRaceExZone", "SnowWorldRaceFlagZone", "SnowWorldRaceGroundZone", "SnowWorldRaceHardExStage", "SnowWorldRaceObjectZone", "SnowWorldRaceTutorialStage", "SnowWorldShopStage", "SnowWorldTownStage", "SnowWorldTownZone", "Special1WorldHomeStage", "Special1WorldTowerBombTailStage", "Special1WorldTowerCapThrowerStage", "Special1WorldTowerFireBlowerStage", "Special1WorldTowerRoomZone", "Special1WorldTowerStackerStage", "Special2WorldCloudStage", "Special2WorldHomeStage", "Special2WorldKoopaStage", "Special2WorldLavaStage", "StaffRollMoonRockDemo", "SwingSteelExStage", "Theater2DExStage", "TogezoRotateExStage", "TrampolineWallCatchExStage", "TrexBikeExStage", "TrexPoppunExStage", "TsukkunClimbExStage", "TsukkunRotateExStage", "WanwanClashExStage", "WaterTubeExStage", "WaterValleyExStage", "WaterfallWorldHomeStage", "WindBlowExStage", "WorldMapStage", "YoshiCloudExStage"];

    // Initialize
    updateButtonStates();
    refreshScripts();
  </script>
</body>
</html>`;
}

// Start servers
startUDPServer();

server.listen(WEB_PORT, () => {
  console.log(`Web interface available at http://localhost:${WEB_PORT}`);
  console.log(`Waiting for Switch client to connect on UDP port ${SERVER_PORT}...`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  if (udpServer) udpServer.close();
  server.close();
  process.exit(0);
});