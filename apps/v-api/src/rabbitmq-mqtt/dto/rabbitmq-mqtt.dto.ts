export interface CreateMqttUserDto {
  username: string;
  password?: string;
  tags?: string[];
}

export interface SetPermissionsDto {
  username: string;
  vhost?: string;
  permissions: {
    configure: string;
    write: string;
    read: string;
  };
}

export interface UpdatePasswordDto {
  username: string;
  newPassword: string;
}

export interface CreateVehicleUserDto {
  vin: string;
}

export interface RabbitMQUserResponse {
  username: string;
  password: string;
  tags: string[];
  roles: string[];
}

export interface RabbitMQPermissionResponse {
  configure: string;
  write: string;
  read: string;
}

export interface RabbitMQHealthResponse {
  status: string;
  mqttEnabled: boolean;
  users: number;
}
