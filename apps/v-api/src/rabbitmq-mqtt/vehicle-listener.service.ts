/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { SocketService } from '../common/services/socket.service';
import { VehicleLogicService } from './vehicle-logic.service';
import { MissionDutyService } from 'src/mission-duty/mission-duty.service';
import { MissionEventsService } from 'src/mission-events/mission-events.service';

@Injectable()
export class VehicleListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VehicleListenerService.name);
  private connection: any = null;
  private channel: any = null;
  private readonly rabbitmqUrl: string;
  private readonly exchangeName = 'amq.topic';
  private readonly queueName = 'vehicle_listener_queue';
  private readonly routingKey = 'vehicle.#'; // Listen to all vehicle channels

  constructor(private readonly socketService: SocketService, private readonly vehicleLogicService: VehicleLogicService, private readonly missionDutyService: MissionDutyService, private readonly missionEventsService: MissionEventsService) {
    // Use environment variables for RabbitMQ connection
    const username = process.env.RABBITMQ_USERNAME || 'admin';
    const password = process.env.RABBITMQ_PASSWORD || 'your-rabbitmq-password-here';
    const host = process.env.RABBITMQ_HOST || 'localhost';
    const port = process.env.RABBITMQ_PORT || '5672';

    this.rabbitmqUrl = `amqp://${username}:${password}@${host}:${port}`;
  }

  async onModuleInit() {
    await this.connectToRabbitMQ();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  emitCommandToMQTT(vin: string, command: string, params: any = {}) {
    const routingKey = `vehicle.${vin}.commands`;
    const message = {
      vin,
      command,
      params,
      timestamp: Date.now(),
    };
    if (this.channel) {
      this.channel.publish(
        this.exchangeName,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
      this.logger.log(`Published command "${command}" to MQTT for VIN ${vin} with routingKey ${routingKey}`);
    } else {
      this.logger.warn('MQTT channel not initialized, cannot emit command');
    }
  }

  async handleTaskRequestDemans(vin: string): Promise<void> {
    const isExist = await this.vehicleLogicService.handleDemandTaskRequest(vin);
    //const messageType = "command"
    this.emitCommandToMQTT(vin, isExist ? "awaitAssignedTaskReload" : "awaitAssignment", { isThereDispatchedTask: isExist });
  }

  async handleTaskStarted(vin: string, content: any): Promise<void> {
    try {
      console.log("handleTaskStarted content.data.missionId", content.data.missionId);
      await this.missionDutyService.update(content.data.missionId, { dispatched: true, dispatchedAt: new Date() });
      content.data.dispatched = true;
      await this.missionEventsService.create({
        event: content.data.event,
        missionId: content.data.missionId,
        missionCode: content.data.missionCode,
        type: content.type,
        data: content.data,
      });
    } catch (error) {
      this.logger.error(`Error in handleTaskStarted for VIN ${vin}:`, error);
      throw error;

    }
  }
  async handleEventMessageDB(vin: string, content: any): Promise<void> {
    await this.missionEventsService.create({
      type: content.type,
      event: content.event,
      missionId: content.data.missionId,
      missionCode: content.data.missionCode,
      data: content.data,
    });
  }


  private async connectToRabbitMQ(): Promise<void> {
    try {
      this.logger.log('Connecting to RabbitMQ...');

      // Create connection
      this.connection = await amqp.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Assert exchange (amq.topic should already exist)
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });

      // Assert queue
      const queue = await this.channel.assertQueue(this.queueName, {
        durable: true,
        exclusive: false,
        autoDelete: false
      });

      // Bind queue to exchange with routing key
      await this.channel.bindQueue(queue.queue, this.exchangeName, this.routingKey);

      this.logger.log(`Queue ${this.queueName} bound to exchange ${this.exchangeName} with routing key ${this.routingKey}`);

      // Start consuming messages
      await this.startConsuming();

      // Handle connection events
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
      });

      this.logger.log('Successfully connected to RabbitMQ and listening for vehicle messages');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async startConsuming(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.consume(
      this.queueName,
      (msg) => {
        if (msg) {
          this.handleVehicleMessage(msg);
          this.channel?.ack(msg);
        }
      },
      { noAck: false }
    );

    this.logger.log(`Started consuming messages from queue: ${this.queueName}`);
  }

  private handleVehicleMessage(msg: any): void {
    try {
      const routingKey = msg.fields.routingKey;
      const content = msg.content.toString();

      this.logger.log(`Received message from ${routingKey}:`);
      this.logger.log(`Content: ${content}`);

      // Parse the message content
      let parsedContent: any;
      try {
        parsedContent = JSON.parse(content);
      } catch {
        this.logger.warn('Failed to parse message as JSON, treating as plain text');
        parsedContent = content;
      }

      // Extract VIN from routing key (e.g., vehicle.VIN123456789.telemetry -> VIN123456789)
      const vin = this.extractVIN(routingKey);

      // Process the message based on its type
      this.processVehicleMessage(vin, routingKey, parsedContent);

    } catch (error) {
      this.logger.error('Error handling vehicle message:', error);
    }
  }

  private extractVIN(routingKey: string): string | null {
    // Expected format: vehicle.{VIN}.{messageType}
    console.log(`Extracting VIN from routing key: ${routingKey}`);
    const parts = routingKey.split('.');
    if (parts.length >= 3 && parts[0] === 'vehicle') {
      return parts[1];
    }
    return null;
  }

  private processVehicleMessage(vin: string | null, routingKey: string, content: any): void {
    if (!vin) {
      this.logger.warn(`Could not extract VIN from routing key: ${routingKey}`);
      return;
    }

    // Determine message type from routing key
    const messageType = this.getMessageType(routingKey);

    this.logger.log(`Processing ${messageType} message for VIN ${vin}`);

    // Here you can add specific logic for different message types
    switch (messageType) {
      case 'telemetry':
        this.handleTelemetryMessage(vin, content);
        break;
      case 'status':
      case 'heartbeat-status':
        this.handleStatusMessage(vin, content);
        break;
      case 'command':
        this.handleCommandMessage(vin, content);
        break;
      case 'event':
      case 'mission-events':
        this.handleEventMessage(vin, content);
        break;
      case 'location':
        this.handleLocationMessage(vin, content);
        break;
      case 'device-demands':
        this.handleDeviceDemandsMessage(vin, routingKey, content,);
        break;
      default:
        this.logger.log(`Unknown message type: ${messageType}`);
        this.handleGenericMessage(vin, messageType, content);
    }

    // Emit VIN-specific event to Socket.IO clients
    this.socketService.emitToVehicleRoom(vin, messageType, {
      vin,
      messageType,
      content,
      routingKey,
      timestamp: Date.now()
    });

    // Also emit VIN-specific event name for clients listening to vehicle_${vin}_${messageType}
    this.socketService.emitToVehicleRoom(vin, `vehicle_${vin}_${messageType}`, {
      vin,
      messageType,
      content,
      routingKey,
      timestamp: Date.now()
    });

    // Also emit to all clients for monitoring (only if needed for debugging)
    // Comment out the line below to stop broadcasting to all clients
    // this.socketService.emitToAll('vehicle_message', {
    //   vin,
    //   messageType,
    //   content,
    //   routingKey,
    //   timestamp: Date.now()
    // });
  }

  private getMessageType(routingKey: string): string {
    const parts = routingKey.split('.');
    return parts.length >= 3 ? parts[2] : 'unknown';
  }

  private handleTelemetryMessage(vin: string, content: any): void {
    this.logger.log(`Telemetry data for VIN ${vin}:`, content);
    // Process telemetry data (GPS, speed, fuel, etc.)
  }

  private handleStatusMessage(vin: string, content: any): void {
    this.logger.log(`Status update for VIN ${vin}:`, content);
    // Process status updates (online/offline, engine state, etc.)
  }

  private handleCommandMessage(vin: string, content: any): void {
    this.logger.log(`Command for VIN ${vin}:`, content);
    // Process commands (start, stop, lock, unlock, etc.)
  }

  private handleEventMessage(vin: string, content: any): void {
    this.logger.log(`Event from VIN ${vin}:`, content);
    this.handleEventMessageDB(vin, content);
    // Process events (alarm, maintenance, etc.)
  }

  private handleLocationMessage(vin: string, content: any): void {
    this.logger.log(`Location update for VIN ${vin}:`, content);
    // Process location updates (GPS coordinates, speed, etc.)
  }


  private handleDeviceDemandsMessage(vin: string, routingKey: string, content: any): void {
    this.logger.log(`handleDeviceDemandsMessage for VIN ${vin}:`, content);
    switch (content.type) {
      case 'demand_task_request': {
        this.logger.log(`Demand task request for VIN ${vin}:`, content);
        this.handleTaskRequestDemans(vin);
        break;
      }
      case 'demand_task_assignment': {
        this.logger.log(`Demand task assignment for VIN ${vin}:`, content);
        this.socketService.emitToVehicleRoom(vin, `vehicle_${vin}_device-demands`, {
          vin,
          messageType: "vehicle_" + vin + "_device-demands",
          content,
          routingKey,
          timestamp: Date.now()
        });

        break;
      }
      case 'demand_task_started': {
        this.logger.log(`Demand task request for VIN ${vin}:`, content);
        this.handleTaskStarted(vin, content);
        break;
      }
      default: {
        this.logger.warn(`Unknown demand type for VIN ${vin}:`, content);
        // Handle unknown type
        break;
      }
    }
  }

  private handleGenericMessage(vin: string, messageType: string, content: any): void {
    this.logger.log(`Generic message (${messageType}) for VIN ${vin}:`, content);
    // Handle any other message types
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  // Public method to get connection status
  public isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  // Public method to manually reconnect
  public async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connectToRabbitMQ();
  }
}