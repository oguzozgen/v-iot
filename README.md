# MQTT & WebSocket Oriented Autonomous Vehicle Management Project

## Prerequisites

- Install **Node.js v22**
- Install **pm2**  
   ```sh
   npm install pm2 -g
   ```
- Install **Docker** & **docker-compose**
- Run  
  ```sh
  docker-compose -f microservice-elements/docker-compose.yml up
  ```
  *(Portainer included for Docker management)*
- Sometimes **telegraf** inits early; restart the telegraf container if needed
- Start UI:  
  ```sh
  npm i
  npm run dev
  ```
  (in `v-ui` project)
- Start API:  
  ```sh
  npm i
  npm run start:dev
  ```
  (in `v-api` project)
- Load Device:  
  ```sh
  npm i
  ```
  (in `simple-device` project)
   application will start device.
---

## Quick Start Guide

1. **Login**  
   - **Username:**  
     ```
     demo_user
     ```
   - **Password:**  
     ```
     demo_user!
     ```

2. **Wizard Setup**  
   - Click on the wizard from the header if needed

3. **Create Device**

4. **Create Vehicle Registry**
   - Ensure the registry radio button selects your record

5. **Create Task**
   - Markers are draggable for correct altitude and position (creates route as task)
   - Ensure the task radio button selects your record

6. **Proceed**
   - Click **Next**
   - Step 3: Click **Check Existing Mission**
     - If result is `true`, click **Start Device**
     - If not, click **Create New Mission** then **Start Device**

7. **Device Management**
   - Manage devices from the device management page
   - Each device runs one instance of `simple-device`

8. **Mission Run**
   - Initialized device sends MQTT message to API, which relays to UI
   - "Load Mission Run" button appears
   - Click **Load Mission Run** to send route/details to device and start run
   - On success, navigate to **Watch Towers** page for live stream and message flow

9. **Metrics & Events**
   - Mission events are created in the collection
   - Telegraf gets device metrics from RabbitMQ and inserts into InfluxDB
   - View/download metrics on the metrics page

---

## Current Design

- `ui` → `api` → `mongodb` → `telegraf` → `influxdb` → `rabbitmq-mqtt` → `simple-device`
- Only half of the intended design is implemented due to time constraints.
- **Data flow:**  
  `device record` → `vehicle registry record` → `task record` → `vehicle + task` → `mission` → `dispatched mission to device` → `device-demand request to ui` → `device run` -> `mission-events`

---

## Missing Implementations

- Mission events need to be queued and consumed one by one from RabbitMQ
- Core project adaptation was skipped
- Worker project should be clustered
- `mission-event task_completed` must trigger binding of mission-event `_ids` onto tasks record
- `simple-device` is JS (should be Python)
- For task GeoSpatial data, **PostGIS** would be better
- Location is only live streamed and saved as metric; could be used for spatial calculations (alerts, distances, verifications) via PostGIS and/or turf.js
- Improved stability needed
- ~~UI WebSocket token verification~~
- Live demo under a domain
- More microservice representation is needed; modular microservices were planned, but their separation was postponed due to time constraints.