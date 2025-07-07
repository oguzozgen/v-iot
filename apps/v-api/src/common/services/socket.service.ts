import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  private readonly logger = new Logger(SocketService.name);
  private io: Server;

  setServer(server: Server) {
    this.io = server;
    this.logger.log('Socket.IO server initialized');
  }

  // Emit to all connected clients
  emitToAll(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
      this.logger.debug(`Emitted ${event} to all clients`);
    }
  }

  // Emit to specific vehicle room
  emitToVehicleRoom(vehicleId: string, event: string, data: any) {
    if (this.io) {
      const roomName = `vehicle_${vehicleId}`;
      this.io.to(roomName).emit(event, data);
      this.logger.debug(`Emitted ${event} to vehicle room: ${roomName}`);
    }
  }

  // Emit to specific client
  emitToClient(clientId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(clientId).emit(event, data);
      this.logger.debug(`Emitted ${event} to client: ${clientId}`);
    }
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    if (this.io) {
      return this.io.sockets.sockets.size;
    }
    return 0;
  }

  // Get clients in a specific room
  getClientsInRoom(roomName: string): Promise<string[]> {
    if (this.io) {
      return this.io.in(roomName).allSockets().then(sockets => Array.from(sockets));
    }
    return Promise.resolve([]);
  }

  // Join client to vehicle room
  joinVehicleRoom(clientId: string, vehicleId: string) {
    if (this.io) {
      const socket = this.io.sockets.sockets.get(clientId);
      if (socket) {
        const roomName = `vehicle_${vehicleId}`;
        void socket.join(roomName);
        this.logger.debug(`Client ${clientId} joined vehicle room: ${roomName}`);
      }
    }
  }

  // Leave client from vehicle room
  leaveVehicleRoom(clientId: string, vehicleId: string) {
    if (this.io) {
      const socket = this.io.sockets.sockets.get(clientId);
      if (socket) {
        const roomName = `vehicle_${vehicleId}`;
        void socket.leave(roomName);
        this.logger.debug(`Client ${clientId} left vehicle room: ${roomName}`);
      }
    }
  }
}
