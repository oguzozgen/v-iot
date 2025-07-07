import { Injectable } from '@nestjs/common';
import { InfluxDB, QueryApi } from '@influxdata/influxdb-client';

@Injectable()
export class InfluxdbService {
  private queryApi: QueryApi;
  private org: string;

  constructor() {
    const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
    const token = process.env.INFLUXDB_TOKEN || 'my-super-secret-auth-token';
    this.org = process.env.INFLUXDB_ORG || 'my-org';
    const influxDB = new InfluxDB({ url, token });
    this.queryApi = influxDB.getQueryApi(this.org);
  }

  async queryFlux(fluxQuery: string): Promise<any[]> {
    const results: any[] = [];
    return new Promise((resolve, reject) => {
      this.queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          results.push(tableMeta.toObject(row));
        },
        error(error) {
          reject(error);
        },
        complete() {
          resolve(results);
        },
      });
    });
  }
}