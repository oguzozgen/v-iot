import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from '../common/services/socket.service';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule

@Module({
  imports: [AuthModule], // Add this line
  providers: [SocketGateway, SocketService],
  exports: [SocketService],
})
export class SocketModule {}
