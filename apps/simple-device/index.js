#!/usr/bin/env node

const MqttClient = require('./mqtt-client');
const chalk = require('chalk').default;

// Parse CLI args
const argv = require('minimist')(process.argv.slice(2));
const vin = argv.v || argv.vin;
const username = argv.u || argv.username;
const password = argv.p || argv.password;
const brokerUrl = argv.b || argv.broker || 'mqtt://localhost:1883';

if (!vin || !username || !password) {
  console.error('Usage: node simple-device.js -v <vin> -u <username> -p <password> [-b <brokerUrl>]');
  process.exit(1);
}

const client = new MqttClient({
  vin,
  brokerUrl,
  username,
  password
});

async function main() {
  let loadedMission;
  let simulationLocked = false;
  await client.connect();

  // Subscribe to commands
  await client.subscribe(client.topics.commands);

  async function handleRequestAssignment(vin, data) {
    await client.publish('device-demands', {
      vin: vin,
      timestamp: Date.now(),
      type: 'demand_task_assignment',
      data: {
        requestType: 'demand_task_assignment',
        message: 'Requesting demand_task_assignment -> demand_task_assignment'
      },
      severity: 'info'
    }, 2);
  }

  async function handleMissionBegan(vin, data) {
    console.log("data", data);
    await client.publish('device-demands', {
      vin: vin,
      timestamp: Date.now(),
      type: 'demand_task_started',
      data: {
        event: "started",
        requestType: 'started',
        message: 'Requesting mission-events -> mission-events ' + vin + ' ' + data.params.missionCode,
        vin: vin,
        missionCode: data.params.missionCode,
        missionId: data.params._id
      },
      severity: 'info'
    }, 1);
    client.publish('mission-events', {
      type: 'mission_events_started',
      event: "started",
      data: {
        vin: vin,
        missionCode: data.params.missionCode,
        missionId: data.params._id
      },
      severity: 'info'
    }, 1);
  }
  async function startSimulation(mission) {
    console.log("missionmissionmissionmissionmissionmissionmission", mission)
    if (!mission?.taskDispatched?.taskRouteLineString?.coordinates || mission?.taskDispatched?.taskRouteLineString?.coordinates?.length === 0) {
      client.publish('mission-events', {
        type: 'mission_events_no_route_coordinates',
        event: "no_route_coordinates",
        data: {
          vin: vin,
          missionCode: mission.missionCode,
          missionId: mission._id
        },
        severity: 'info'
      }, 1);
      return console.error(chalk.red(`[${vin}] No mission loaded or mission is invalid.`));
    }
    if (simulationLocked) {
      client.publish('mission-events', {
        type: 'mission_events_simulation_locked',
        event: "simulation_locked",
        data: {
          vin: vin,
          missionCode: mission.missionCode,
          missionId: mission._id
        },
        severity: 'info'
      }, 1);
      return console.error(chalk.red(`[${vin}] Simulation is already running.`));
    }
    simulationLocked = true;

    try {
      console.log(chalk.green(`[${vin}] Simulation started for mission:`), mission);
      let coordinates = mission.taskDispatched.taskRouteLineString.coordinates;

      client.publish('mission-events', {
        type: 'mission_events_heading_to_destination',
        event: "heading_to_destination",
        data: {
          missionCode: mission.missionCode,
          missionId: mission._id,
          vin: vin,
        },
        severity: 'info'
      }, 2);
      for (let i = 0; i < coordinates.length; i++) {
        const [longitude, latitude, altitude] = coordinates[i];
        client.publish('location', {
          vin: vin,
          latitude,
          longitude,
          altitude: altitude || 9,
          timestamp: Date.now()
        }, 1);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      console.log(chalk.green(`[${vin}] Simulation completed.`));
      client.publish('mission-events', {
        type: 'mission_events_destination_reached',
        event: "destination_reached",
        data: {
          missionCode: mission.missionCode,
          missionId: mission._id,
          vin: vin,
        },
        severity: 'info'
      }, 1);

      client.publish('mission-events', {
        type: 'mission_events_return_to_base',
        event: "return_to_base",
        data: {
          missionCode: mission.missionCode,
          missionId: mission._id,
          vin: vin,
        },
        severity: 'info'
      }, 1);

      for (let i = coordinates.length - 1; i >= 0; i--) {
        const [longitude, latitude] = coordinates[i];
        client.publish('location', {
          vin: vin,
          latitude,
          longitude,
          timestamp: Date.now()
        }, 0);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      client.publish('mission-events', {
        type: 'mission_events_returned_to_base',
        event: "returned_to_base",
        data: {
          missionCode: mission.missionCode,
          missionId: mission._id,
          vin: vin,
        },
        severity: 'info'
      }, 1);
      client.publish('mission-events', {
        type: 'mission_events_docked',
        event: "docked",
        data: {
          vin: vin,
          missionCode: mission.missionCode,
          missionId: mission._id
        },
        severity: 'info'
      }, 1);
      client.publish('mission-events', {
        type: 'mission_events_completed',
        event: "completed",
        data: {
          vin: vin,
          missionCode: mission.missionCode,
          missionId: mission._id
        },
        severity: 'info'
      }, 2);
      simulationLocked = false;
    } catch (error) {
      console.error(chalk.red(`[${vin}] Simulation error:`), error.message);
      simulationLocked = false;
      client.publish('mission-events', {
        type: 'mission_events_task_error',
        event: "task_error",
        data: {
          vin: vin,
          missionCode: mission?.missionCode || 'unknown',
          missionId: mission?._id || 'unknown'
        },
        severity: 'error'
      }, 1)
    }
  }

  // Listen for commands
  client.on('message', (topic, message) => {
    if (topic === client.topics.commands) {
      console.log(chalk.yellow(`[${vin}] Received command:`), message.toString());
      let safeMessage = JSON.parse(message.toString());
      switch (safeMessage.command) {
        case 'awaitAssignment':
          console.log(chalk.blue(`[${vin}] Command: awaitAssignment`));
          handleRequestAssignment(vin, safeMessage.data);
          break;
        case 'awaitAssignedTaskReload':
          console.log(chalk.blue(`[${vin}] Command: awaitAssignedTaskReload`));
          console.log("awaitAssignedTaskReload", safeMessage)
          // Add update logic here
          break;
        case 'load_mission':
          console.log(chalk.blue(`[${vin}] Command:load_mission.`));
          loadedMission = safeMessage.params;
          handleMissionBegan(vin, safeMessage);
          startSimulation(loadedMission);
          break;
        default:
          console.log(chalk.red(`[${vin}] Unknown command type:`), safeMessage.type);
      }
    }
  });

  // Publish deviceDemands once on startup
  await client.publish('device-demands', {
    vin: this.vin,
    timestamp: Date.now(),
    type: 'demand_task_request',
    data: {
      requestType: 'demand_initial_tasks',
      message: 'Requesting initial task assignment'
    },
    severity: 'info'
  }, 2);

  // Publish heartbeat every 5 seconds
  setInterval(() => {
    client.publish('heartbeat', {
      vin: this.vin,
      status: "online",
      timestamp: Date.now(),
      connectivity: 'good'
    }, 0);
  }, 5000);
  setInterval(() => {
    client.publish('telemetry', {
      type: "telemetry",
      data: {
        timestamp: new Date().toISOString(),
        speed: Math.random() * 60, // km/h
        batteryLevel: 70 + Math.random() * 30,
        batteryVoltage: 380 + Math.random() * 40,
        batteryCurrent: 100 + Math.random() * 50,
        stateOfCharge: 70 + Math.random() * 30,
        estimatedRange: 100 + Math.random() * 50,
        latitude: 40.7128 + Math.random() * 0.01,
        longitude: -74.0060 + Math.random() * 0.01,
        altitude: 10 + Math.random() * 5,
        heading: Math.random() * 360,
        odometer: 15342 + Math.random() * 100,
        temperature: 25 + Math.random() * 10,
        isAutonomous: true,
        errorCode: null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, 0);
  }, 3000);
}

main().catch(err => {
  console.error(chalk.red('Device error:'), err.message);
  process.exit(1);
});