/* eslint-disable */

import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { MissionDutyService } from 'src/mission-duty/mission-duty.service';
import { VehicleListenerService } from './vehicle-listener.service';
import { MissionEventsService } from 'src/mission-events/mission-events.service';

export interface RabbitMQUser {
    username: string;
    password: string;
    tags: string[];
    roles: string[];
}

export interface RabbitMQPermission {
    configure: string;
    write: string;
    read: string;
}

export interface RabbitMQACL {
    topic: string;
    priority: number;
    allow: boolean;
}

export interface RabbitMQRole {
    roleName: string;
    acls: RabbitMQACL[];
}

@Injectable()
export class RabbitmqMqttService {
    private readonly logger = new Logger(RabbitmqMqttService.name);
    private readonly apiClient: AxiosInstance;
    private readonly managementUrl: string;
    private readonly adminCredentials: { username: string; password: string, };



    constructor(
        private readonly missionDutyService: MissionDutyService,
        private readonly vehicleListenerService: VehicleListenerService,
        private readonly missionEventsService: MissionEventsService,
    ) {
        this.managementUrl = process.env.RABBITMQ_MANAGEMENT_URL || 'http://localhost:15672/api';
        this.adminCredentials = {
            username: process.env.RABBITMQ_USERNAME || 'admin',
            password: process.env.RABBITMQ_PASSWORD || 'your-rabbitmq-password-here'
        };
        this.apiClient = axios.create({
            baseURL: this.managementUrl,
            auth: this.adminCredentials,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

    }

    /**
     * Generate a secure random password
     */
    private generatePassword(length: number = 16): string {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    /**
     * Create a new MQTT user in RabbitMQ
     */

    async createUser(username: string, password?: string, tags: string[] = ['mqtt']): Promise<RabbitMQUser> {
        if (!username || username.trim() === '') {
            throw new BadRequestException('Username is required');
        }

        const generatedPassword = password || this.generatePassword();

        try {
            // Create user
            await this.apiClient.put(`/users/${username}`, {
                password: generatedPassword,
                tags: tags.join(',')
            });

            this.logger.log(`Created RabbitMQ user: ${username}`);

            return {
                username,
                password: generatedPassword,
                tags,
                roles: []
            };
        } catch (error) {
            this.logger.error(`Failed to create user ${username}:`, error.response?.data || error.message);
            throw new InternalServerErrorException(`Failed to create user: ${error.response?.data?.reason || error.message}`);
        }
    }

    /**
     * Delete a user from RabbitMQ
     */
    async deleteUser(username: string): Promise<void> {
        if (!username || username.trim() === '') {
            throw new BadRequestException('Username is required');
        }

        try {
            await this.apiClient.delete(`/users/${username}`);
            this.logger.log(`Deleted RabbitMQ user: ${username}`);
        } catch (error) {
            this.logger.error(`Failed to delete user ${username}:`, error.response?.data || error.message);
            throw new InternalServerErrorException(`Failed to delete user: ${error.response?.data?.reason || error.message}`);
        }
    }

    /**
     * Set permissions for a user on a vhost
     */
    async setUserPermissions(username: string, vhost: string = '/', permissions: RabbitMQPermission): Promise<void> {
        if (!username || username.trim() === '') {
            throw new BadRequestException('Username is required');
        }

        try {
            const encodedVhost = encodeURIComponent(vhost);
            await this.apiClient.put(`/permissions/${encodedVhost}/${username}`, permissions);

            this.logger.log(`Set permissions for user ${username} on vhost ${vhost}`);
        } catch (error) {
            this.logger.error(`Failed to set permissions for user ${username}:`, error.response?.data || error.message);
            throw new InternalServerErrorException(`Failed to set permissions: ${error.response?.data?.reason || error.message}`);
        }
    }

    /**
     * Create a vehicle-specific MQTT user with appropriate topic permissions
     */
    async createVehicleUser(vin: string): Promise<RabbitMQUser> {
        if (!vin || vin.trim() === '') {
            throw new BadRequestException('VIN is required');
        }

        const username = `vehicle_${vin}`;
        const password = this.generatePassword();

        try {
            // Create user
            const user = await this.createUser(username, password, ['vehicle', 'mqtt']);

            // Set vehicle-specific permissions for MQTT topics and infrastructure
            const permissions: RabbitMQPermission = {
                configure: `^amq\\.topic$|^mqtt-subscription-${username}.*|^vehicle\\.${vin}\\..*`,
                write: `^amq\\.topic$|^mqtt-subscription-${username}.*|^vehicle\\.${vin}\\..*`,
                read: `^amq\\.topic$|^mqtt-subscription-${username}.*|^vehicle\\.${vin}\\..*|^system\\.broadcast\\..*`
            };

            await this.setUserPermissions(username, '/', permissions);

            this.logger.log(`Created vehicle user for VIN: ${vin}`);

            return user;
        } catch (error) {
            this.logger.error(`Failed to create vehicle user for VIN ${vin}:`, error.message);
            throw new InternalServerErrorException(`Failed to create vehicle user: ${error.message}`);
        }
    }

    /**
     * Delete a vehicle-specific MQTT user
     */
    async deleteVehicleUser(vin: string): Promise<void> {
        if (!vin || vin.trim() === '') {
            throw new BadRequestException('VIN is required');
        }

        const username = `vehicle_${vin}`;

        try {
            await this.deleteUser(username);
            this.logger.log(`Deleted vehicle user for VIN: ${vin}`);
        } catch (error) {
            this.logger.error(`Failed to delete vehicle user for VIN ${vin}:`, error.message);
            throw new InternalServerErrorException(`Failed to delete vehicle user: ${error.message}`);
        }
    }

    /**
     * Update permissions for an existing vehicle user
     */
    async updateVehicleUserPermissions(vin: string): Promise<void> {
        if (!vin || vin.trim() === '') {
            throw new BadRequestException('VIN is required');
        }

        const username = `vehicle_${vin}`;

        try {
            // Set updated vehicle-specific permissions for MQTT infrastructure
            const permissions: RabbitMQPermission = {
                configure: `^amq\\.topic$|^mqtt-subscription-${username}.*|^vehicle\\.${vin}\\..*`,
                write: `^amq\\.topic$|^mqtt-subscription-${username}.*|^vehicle\\.${vin}\\..*`,
                read: `^amq\\.topic$|^mqtt-subscription-${username}.*|^vehicle\\.${vin}\\..*|^system\\.broadcast\\..*`
            };

            await this.setUserPermissions(username, '/', permissions);
            this.logger.log(`Updated permissions for vehicle user: ${username}`);
        } catch (error) {
            this.logger.error(`Failed to update permissions for vehicle user ${username}:`, error.message);
            throw new InternalServerErrorException(`Failed to update vehicle user permissions: ${error.message}`);
        }
    }

    /**
     * List all users
     */
    async listUsers(): Promise<string[]> {
        try {
            const response = await this.apiClient.get('/users');
            return response.data.map((user: any) => user.name);
        } catch (error) {
            this.logger.error('Failed to list users:', error.response?.data || error.message);
            throw new InternalServerErrorException(`Failed to list users: ${error.response?.data?.reason || error.message}`);
        }
    }

    /**
     * Get user details
     */
    async getUser(username: string): Promise<any> {
        if (!username || username.trim() === '') {
            throw new BadRequestException('Username is required');
        }

        try {
            const response = await this.apiClient.get(`/users/${username}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to get user ${username}:`, error.response?.data || error.message);
            throw new InternalServerErrorException(`Failed to get user: ${error.response?.data?.reason || error.message}`);
        }
    }

    /**
     * Update user password
     */
    async updateUserPassword(username: string, newPassword: string): Promise<void> {
        if (!username || username.trim() === '') {
            throw new BadRequestException('Username is required');
        }

        if (!newPassword || newPassword.trim() === '') {
            throw new BadRequestException('Password is required');
        }

        try {
            // Get current user to preserve tags
            const currentUser = await this.getUser(username);

            await this.apiClient.put(`/users/${username}`, {
                password: newPassword,
                tags: currentUser.tags
            });

            this.logger.log(`Updated password for user: ${username}`);
        } catch (error) {
            this.logger.error(`Failed to update password for user ${username}:`, error.response?.data || error.message);
            throw new InternalServerErrorException(`Failed to update password: ${error.response?.data?.reason || error.message}`);
        }
    }

    /**
     * Get user permissions
     */
    async getUserPermissions(username: string, vhost: string = '/'): Promise<RabbitMQPermission | null> {
        try {
            const encodedVhost = encodeURIComponent(vhost);
            const response = await this.apiClient.get(`/permissions/${encodedVhost}/${username}`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            this.logger.error(`Failed to get permissions for user ${username}:`, error.response?.data || error.message);
            throw new InternalServerErrorException(`Failed to get permissions: ${error.response?.data?.reason || error.message}`);
        }
    }

    /**
     * List all vehicle users (users with 'vehicle' tag)
     */
    async listVehicleUsers(): Promise<string[]> {
        try {
            const response = await this.apiClient.get('/users');
            return response.data
                .filter((user: any) => user.tags && user.tags.includes('vehicle'))
                .map((user: any) => user.name);
        } catch (error) {
            this.logger.error('Failed to list vehicle users:', error.response?.data || error.message);
            throw new InternalServerErrorException(`Failed to list vehicle users: ${error.response?.data?.reason || error.message}`);
        }
    }

    /**
     * Check RabbitMQ connection and MQTT plugin status
     */
    async getHealthStatus(): Promise<{ status: string; mqttEnabled: boolean; users: number }> {
        try {
            // Check overview
            const overviewResponse = await this.apiClient.get('/overview');

            // Check if MQTT plugin is enabled
            const nodesResponse = await this.apiClient.get('/nodes');
            const mqttEnabled = nodesResponse.data.some((node: any) =>
                node.enabled_plugins && node.enabled_plugins.includes('rabbitmq_mqtt')
            );

            // Count users
            const usersResponse = await this.apiClient.get('/users');

            return {
                status: 'healthy',
                mqttEnabled,
                users: usersResponse.data.length
            };
        } catch (error) {
            this.logger.error('Failed to get health status:', error.response?.data || error.message);
            throw new InternalServerErrorException(`Failed to get health status: ${error.response?.data?.reason || error.message}`);
        }
    }

    sendCommandToVehicle(vin: string, command: string, params: any = {}) {
        if (!vin || vin.trim() === '') {
            throw new BadRequestException('VIN is required');
        }
        if (!command || typeof command !== 'string') {
            throw new BadRequestException('Command is required and must be a string');
        }
        try {
            this.vehicleListenerService.emitCommandToMQTT(vin, command, params);
            this.logger.log(`Sent command "${command}" to vehicle ${vin}`);
        } catch (error) {
            this.logger.error(`Failed to send command to vehicle ${vin}:`, error.message);
            throw new InternalServerErrorException(`Failed to send command: ${error.message}`);
        }
    }

    async sendMissionToVehicle(vin: string, missionCode: string): Promise<{ sent: boolean }> {
        if (!vin || vin.trim() === '') {
            throw new BadRequestException('VIN is required');
        }

        if (!missionCode || typeof missionCode !== 'string') {
            throw new BadRequestException('Mission data is required and must be an object');
        }

        const username = `vehicle_${vin}`;
        const topic = `vehicle/${vin}/commands`;

        try {
            // Ensure the user exists
            let missionRecords = await this.missionDutyService.findByMissionCodeAndVin(missionCode, vin);
            let missionRecord = missionRecords[0];
            this.sendCommandToVehicle(vin, 'load_mission', missionRecord);
            await this.missionEventsService.create({
                missionId: missionRecord._id,
                missionCode: missionRecord.missionCode,
                type: 'mission',
                event: 'mission_sent',
                data: {
                    vin,
                    missionCode,
                    timestamp: new Date().toISOString()
                }
            });
        let updatedMiss

            this.logger.log(`Sent mission to vehicle ${vin} on topic ${topic}`);
            return {
                sent: true
            };
        } catch (error) {
            this.logger.error(`Failed to send mission to vehicle ${vin}:`, error.response?.data || error.message);
            throw new InternalServerErrorException(`Failed to send mission: ${error.response?.data?.reason || error.message}`);
        }
    }
}
/* eslint-enable */