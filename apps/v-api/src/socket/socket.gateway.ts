import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SocketService } from '../common/services/socket.service';
import { AuthService } from '../auth/auth.service'; // Import AuthService

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private readonly socketService: SocketService,
    private readonly authService: AuthService, // Inject AuthService
  ) {}

  afterInit(server: Server) {
    this.socketService.setServer(server);
    this.logger.log('Socket.IO Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Get token from client handshake auth 
      
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const token = client.handshake.auth?.token || client.handshake.headers['authorization']?.split(' ')[1];
      if (!token) {
        this.logger.warn(`Client ${client.id} missing token, disconnecting`);
        client.emit('error', 'Authentication token missing');
        client.disconnect();
        return;
      }
      // Validate token
      await this.authService.validate({ headers: { authorization: `Bearer ${token}` } } as any);
      this.logger.log(`Client connected: ${client.id} (token valid)`);

      // Send welcome message
      client.emit('connection_established', {
        clientId: client.id,
        timestamp: Date.now(),
        message: 'Connected to V-IoT Socket.IO server',
      });

      // Send current stats
      const stats = {
        connectedClients: this.socketService.getConnectedClientsCount(),
        serverTime: Date.now(),
      };
      client.emit('server_stats', stats);
    } catch (err) {

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.warn(`Client ${client.id} failed auth: ${err.message}`);
      client.emit('error', 'Authentication failed');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_vehicle_room')
  handleJoinVehicleRoom(
    @MessageBody() data: { vin: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Client ${client.id} joining vehicle room for VIN: ${data.vin}`);
    this.socketService.joinVehicleRoom(client.id, data.vin);
    
    client.emit('joined_vehicle_room', {
      vin: data.vin,
      roomName: `vehicle_${data.vin}`,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('leave_vehicle_room')
  handleLeaveVehicleRoom(
    @MessageBody() data: { vin: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Client ${client.id} leaving vehicle room for VIN: ${data.vin}`);
    this.socketService.leaveVehicleRoom(client.id, data.vin);
    
    client.emit('left_vehicle_room', {
      vin: data.vin,
      roomName: `vehicle_${data.vin}`,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('join_empty_room')
  handleJoinEmptyRoom(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client ${client.id} joining empty room to keep connection alive`);
    void client.join('empty_room');
    
    client.emit('joined_empty_room', {
      roomName: 'empty_room',
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('get_server_stats')
  handleGetServerStats(@ConnectedSocket() client: Socket) {
    const stats = {
      connectedClients: this.socketService.getConnectedClientsCount(),
      serverTime: Date.now(),
    };
    client.emit('server_stats', stats);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }

  @SubscribeMessage('empty_room_ping')
  handleEmptyRoomPing(@ConnectedSocket() client: Socket) {
    this.logger.log(`Empty room ping from client ${client.id}`);
    client.emit('ping_response', { 
      timestamp: Date.now(),
      message: 'Empty room connection alive' 
    });
  }

  @SubscribeMessage('test_message')
  handleTestMessage(
    @MessageBody() data: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Test message from client ${client.id}:`, data);
    client.emit('test_response', {
      receivedData: data,
      timestamp: Date.now(),
      clientId: client.id,
    });
  }
}
