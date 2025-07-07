import { useState, useEffect, useCallback } from "react";
import { useAxiosContext } from "../../context/axios-context";
import { Card, Table, Select, Spin, Col, Divider, Row } from "antd";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Metrics = () => {
    const { getData } = useAxiosContext();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // For vehicle metrics
    const [vehicles, setVehicles] = useState([]);
    const [selectedVin, setSelectedVin] = useState(null);
    const [vehicleMetrics, setVehicleMetrics] = useState([]);
    const [vehicleLoading, setVehicleLoading] = useState(false);

    // Fetch all metrics (default)
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getData('/metrics');
            if (response.data) setData(response.data);
        } catch {
            console.error('Failed to fetch metrics');
        } finally {
            setLoading(false);
        }
    }, [getData]);

    // Fetch all vehicles
    const fetchVehicles = useCallback(async () => {
        try {
            const response = await getData('/vehicle-registries');
            if (response.data) setVehicles(response.data);
        } catch {
            console.error('Failed to fetch vehicles');
        }
    }, [getData]);

    // Fetch metrics for selected VIN
    const fetchVehicleMetrics = useCallback(async (vin) => {
        setVehicleLoading(true);
        try {
            const response = await getData(`/metrics/vin?vin=${vin}`);
            if (response.data) setVehicleMetrics(response.data);
        } catch {
            console.error('Failed to fetch vehicle metrics');
            setVehicleMetrics([]);
        } finally {
            setVehicleLoading(false);
        }
    }, [getData]);

    useEffect(() => {
        fetchData();
        fetchVehicles();
    }, [fetchData, fetchVehicles]);

    useEffect(() => {
        if (selectedVin) {
            fetchVehicleMetrics(selectedVin);
        }
    }, [selectedVin, fetchVehicleMetrics]);

    // Chart and table helpers
    const speedData = data
        .filter(d => d._field === "data_speed")
        .map(d => ({ time: d._time, value: d._value }));

    const vehicleSpeedData = vehicleMetrics
        .filter(d => d._field === "data_speed")
        .map(d => ({ time: d._time, value: d._value }));

    const columns = [
        { title: "Time", dataIndex: "_time", key: "_time" },
        { title: "Field", dataIndex: "_field", key: "_field" },
        { title: "Value", dataIndex: "_value", key: "_value" },
        { title: "Topic", dataIndex: "topic", key: "topic" }
    ];

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "metrics.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleVehicleExport = () => {
        const blob = new Blob([JSON.stringify(vehicleMetrics, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "vehicle-metrics.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <Row gutter={[32, 32]}>
                <Col span={24}>
                    <Card>
                        <h3>Speed Chart (All Metrics)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={speedData}>
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="value" stroke="#8884d8" name="Speed" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col span={24}>
                    <Card title={"All Metrics"} extra={<button onClick={handleExport}>Export JSON</button>}>
                        <Table
                            dataSource={data}
                            columns={columns}
                            rowKey={(_, i) => i}
                            scroll={{ x: 1000 }}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Divider />
                <Col span={24}>

                    <Card
                        title="Vehicle Metrics"
                        extra={
                            <>
                                <Select
                                    showSearch
                                    style={{ width: 250, marginRight: 16 }}
                                    placeholder="Select a vehicle"
                                    optionFilterProp="children"
                                    value={selectedVin}
                                    onChange={setSelectedVin}
                                    filterOption={(input, option) =>
                                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {vehicles.map(v => (
                                        <Select.Option key={v.vin || v._id} value={v.vin}>
                                            {v.name || v.vin}
                                        </Select.Option>
                                    ))}
                                </Select>
                                <button onClick={handleVehicleExport} disabled={!vehicleMetrics.length}>Export JSON</button>
                            </>
                        }
                    >
                        {vehicleLoading ? (
                            <Spin />
                        ) : (
                            <>
                                <h3>Speed Chart (Selected Vehicle)</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={vehicleSpeedData}>
                                        <XAxis dataKey="time" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="value" stroke="#82ca9d" name="Speed" />
                                    </LineChart>
                                </ResponsiveContainer>
                                <Table
                                    dataSource={vehicleMetrics}
                                    columns={columns}
                                    rowKey={(_, i) => i}
                                    scroll={{ x: 1000 }}
                                />
                            </>
                        )}
                    </Card>
                </Col>
            </Row>


        </>
    );
};