const mqtt = require('mqtt');
const EventEmitter = require('events');
const chalk = require('chalk').default;

class MqttClient extends EventEmitter {
  constructor(options) {
    super();
    this.vin = options.vin;
    this.brokerUrl = options.brokerUrl;
    this.username = options.username;
    this.password = options.password;
    this.clientId = `vehicle_${this.vin}`;
    this.client = null;
    this.isConnected = false;

    // Topic structure: vehicle-specific and system broadcast
    this.topics = {
      telemetry: `vehicle/${this.vin}/telemetry`,
      heartbeatStatus: `vehicle/${this.vin}/heartbeat-status`,
      missionEvents: `vehicle/${this.vin}/mission-events`,
      deviceDemands: `vehicle/${this.vin}/device-demands`,
      location: `vehicle/${this.vin}/location`,
      commands: `vehicle/${this.vin}/commands`,
    };
  }

  getCommandTopics() {
    return [
      this.topics.commands,          // Vehicle-specific commands
    ];
  }

  getTopicByType(type) {
    switch (type) {
      case 'telemetry':
        return this.topics.telemetry;
      case 'heartbeat':
      case 'status':
        return this.topics.heartbeatStatus;
      case 'events':
        return this.topics.missionEvents;
      case 'mission-events':
        return this.topics.missionEvents;
      case 'location':
        return this.topics.location;
      case 'demands':
      case 'device-demands':
        return this.topics.deviceDemands;
      default:
        return null;
    }
  }

  async connect() {
    try {
      console.log(chalk.gray(`RabbitMQ MQTT Broker: ${this.brokerUrl}`));
      console.log(chalk.gray(`Username: ${this.username}`));
      console.log(chalk.gray(`Client ID: ${this.clientId}`));

      // RabbitMQ MQTT connection options
      const connectionOptions = {
        clientId: this.clientId,
        username: this.username,
        password: this.password,
        clean: true,
        connectTimeout: 10000,
        keepalive: 60,
        reconnectPeriod: 5000,
        protocolVersion: 4, // MQTT 3.1.1 - RabbitMQ default
        will: {
          topic: this.topics.heartbeatStatus,
          payload: JSON.stringify({
            vin: this.vin,
            status: 'offline',
            timestamp: Date.now()
          }),
          qos: 1,
          retain: false
        }
      };

      this.client = mqtt.connect(this.brokerUrl, connectionOptions);

      this.setupEventHandlers();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout - check if RabbitMQ MQTT plugin is enabled'));
        }, 15000);

        const onConnect = () => {
          clearTimeout(timeout);
          this.isConnected = true;
          // console.log(chalk.green(`[${this.vin}] Connected to RabbitMQ MQTT broker`));
          this.client.removeListener('connect', onConnect);
          this.client.removeListener('error', onError);
          this.emit('connect');
          resolve();
        };

        const onError = (error) => {
          clearTimeout(timeout);
          this.client.removeListener('connect', onConnect);
          this.client.removeListener('error', onError);
          reject(error);
        };

        this.client.on('connect', onConnect);
        this.client.on('error', onError);
      });
    } catch (error) {
      throw new Error(`Failed to connect to RabbitMQ MQTT broker: ${error.message}`);
    }
  }

  setupEventHandlers() {
    this.client.on('error', (error) => {
      console.error(chalk.red(`[${this.vin}] MQTT Error:`), error.message);
      this.emit('error', error);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      console.log(chalk.yellow(`[${this.vin}] MQTT connection closed`));
      this.emit('close');
    });

    this.client.on('message', (topic, message) => {
      this.emit('message', topic, message);
    });

    this.client.on('reconnect', () => {
      console.log(chalk.blue(`[${this.vin}] Reconnecting to RabbitMQ MQTT broker...`));
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      console.log(chalk.green(`[${this.vin}] Connected to RabbitMQ MQTT broker`));
      this.emit('connect');
    });
  }

  async subscribe(topic) {
    if (!this.isConnected) {
      throw new Error(`Cannot subscribe to ${topic}: not connected`);
    }

    return new Promise((resolve, reject) => {
      const qos = topic.includes('/commands') ? 2 : 1;
      this.client.subscribe(topic, { qos: qos }, (error) => {
        if (error) {
          console.error(chalk.red(`[${this.vin}] Failed to subscribe to ${topic}:`), error.message || 'Unspecified error');
          reject(error);
        } else {
          console.log(chalk.green(`[${this.vin}] Subscribed to: ${topic}`));
          resolve();
        }
      });
    });
  }

  async publish(topicType, payload, qos = 0, retain = false) {
    if (!this.isConnected) {
      console.error(chalk.red(`[${this.vin}] Cannot publish: not connected`));
      return;
    }

    const topic = this.getTopicByType(topicType);
    if (!topic) {
      console.error(chalk.red(`[${this.vin}] Unknown topic type: ${topicType}`));
      return;
    }

    try {
      const message = JSON.stringify(payload);
      await new Promise((resolve, reject) => {
        this.client.publish(topic, message, { qos, retain }, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error(chalk.red(`[${this.vin}] Error publishing to ${topic}:`), error.message);
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      this.client.end();
      this.isConnected = false;
    }
  }
}

module.exports = MqttClient;
