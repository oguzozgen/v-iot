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

export interface RabbitMQHealthStatus {
  status: string;
  mqttEnabled: boolean;
  users: number;
}
