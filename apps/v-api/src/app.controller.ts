import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { InfluxdbService } from './influxdb/influxdb.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly influxdbService: InfluxdbService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('directions')
  async getDirections(
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('profile') profile: string = 'driving-car'
  ) {
    try {
      const apiKey = process.env.OPEN_ROUTE_SERVICE_API_KEY || "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjEzZGVlYjcwYTFhYjQ4NDE4N2E1NGNiMDMzZWI5ZTY2IiwiaCI6Im11cm11cjY0In0=";

      if (!apiKey) {
        throw new HttpException(
          'OpenRouteService API key not configured',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      if (!start || !end) {
        throw new HttpException(
          'Start and end coordinates are required',
          HttpStatus.BAD_REQUEST
        );
      }

      const url = `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${apiKey}&start=${start}&end=${end}`;

      console.log('Requesting URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, application/geo+json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouteService error:', errorText);
        throw new HttpException(
          `OpenRouteService returned ${response.status}: ${errorText}`,
          HttpStatus.BAD_GATEWAY
        );
      }

      const data = await response.json();
      console.log('Successfully fetched directions');
      return data;
    } catch (error) {
      console.error('Error in getDirections:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error while fetching directions',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }



  @Get('metrics')
  async getMetrics() {
    const fluxQuery = `
      from(bucket: "my-bucket")
        |> range(start: -1d)
        |> filter(fn: (r) => r["_field"] == "altitude" or r["_field"] == "data_altitude" or r["_field"] == "data_batteryCurrent" or r["_field"] == "data_batteryVoltage" or r["_field"] == "data_batteryLevel" or r["_field"] == "data_estimatedRange" or r["_field"] == "data_heading" or r["_field"] == "data_latitude" or r["_field"] == "data_longitude" or r["_field"] == "data_odometer" or r["_field"] == "data_speed" or r["_field"] == "data_temperature" or r["_field"] == "data_stateOfCharge" or r["_field"] == "latitude" or r["_field"] == "longitude" or r["_field"] == "timestamp")
        |> filter(fn: (r) => r["_measurement"] == "mqtt_consumer")
        |> filter(fn: (r) => r["host"] == "telegraf")
        |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
        |> yield(name: "mean")
    `;
    return this.influxdbService.queryFlux(fluxQuery);
  }

  @Get('metrics/vin')
  async getMetricsByVin(@Query('vin') vin: string) {
    if (!vin) {
      throw new HttpException('VIN is required', HttpStatus.BAD_REQUEST);
    }

    const topics = [
      `vehicle/${vin}/telemetry`,
      `vehicle/${vin}/device-demands`,
      `vehicle/${vin}/location`,
      `vehicle/${vin}/mission-events`,
      `vehicle/${vin}/commands`
    ];

    const topicFilter = topics
      .map(t => `r["topic"] == "${t}"`)
      .join(' or ');

    const fluxQuery = `
    from(bucket: "my-bucket")
      |> range(start: -1d)
      |> filter(fn: (r) => r["_field"] == "altitude" or r["_field"] == "data_altitude" or r["_field"] == "data_batteryCurrent" or r["_field"] == "data_batteryVoltage" or r["_field"] == "data_batteryLevel" or r["_field"] == "data_estimatedRange" or r["_field"] == "data_heading" or r["_field"] == "data_latitude" or r["_field"] == "data_longitude" or r["_field"] == "data_odometer" or r["_field"] == "data_speed" or r["_field"] == "data_temperature" or r["_field"] == "data_stateOfCharge" or r["_field"] == "latitude" or r["_field"] == "longitude" or r["_field"] == "timestamp")
      |> filter(fn: (r) => r["_measurement"] == "mqtt_consumer")
      |> filter(fn: (r) => r["host"] == "telegraf")
      |> filter(fn: (r) => ${topicFilter})
      |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
      |> yield(name: "mean")
  `;
    return this.influxdbService.queryFlux(fluxQuery);
  }
}
