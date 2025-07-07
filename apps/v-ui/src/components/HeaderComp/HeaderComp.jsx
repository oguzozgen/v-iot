
import { Button, Flex, Menu, Popover, Switch } from "antd";
import { Header } from "antd/es/layout/layout";
import { useNavigate } from "react-router-dom";
import { SignedIn, UserButton } from "@clerk/clerk-react";

import { BugOutlined, CarTwoTone, DatabaseOutlined, DotChartOutlined, HomeOutlined, PlayCircleOutlined, RadarChartOutlined, RocketTwoTone } from "@ant-design/icons";
import { Children } from "react";

export default function HeaderComp() {
    // const publicUrl = import.meta.env.VITE_PUBLIC_URL;

    const navigate = useNavigate();

    const urls = {
        home: '/home',
        vehicleRegistries: '/vehicle-registries',
        tasks: '/tasks',
        devices: '/devices',
        watchTowers: "/watch-towers",
        deviceManagement: "/pm2-device-management",
        metrics: "/metrics"
    };

    const menuItems = [
        {
            key: "home",
            label: "Wizard",
            icon: <PlayCircleOutlined />
        },
        {
            key: "watchTowers",
            label: "Watch Tower",
            icon: <RocketTwoTone />
        },
        {
            key: "deviceManagement",
            label: "Device Management",
            icon: <BugOutlined />
        },
        {
            key: "metrics",
            label: "Metrics",
            icon: <DotChartOutlined />
        },
        {
            key: "data",
            label: "Data",
            icon: <DatabaseOutlined />,
            children: [
                {
                    key: "devices",
                    label: "Devices",
                    icon: <RadarChartOutlined />
                },
                {
                    key: "vehicleRegistries",
                    label: "Vehicle Registries",
                    icon: <RadarChartOutlined />
                },
                {
                    key: "tasks",
                    label: "Tasks",
                    icon: <RadarChartOutlined />
                },
            ]
        },


    ]

    const handleMenuClick = (e) => {
        navigate(`${urls[e.key]}`, { replace: true });
    }

    return (
        <>
            <Header
                style={{
                    display: 'flex',
                    alignItems: 'center',
                }}>
                <Flex wrap gap="small" justify="space-between" align="center" style={{ padding: "0 1.8rem", background: "#001529", width: "100%" }}>
                    <Button icon={<CarTwoTone style={{ fontSize: "32px" }} />} type="text" onClick={() => navigate("/")} style={{ width: 150 }} >

                    </Button>
                    <Menu
                        theme="dark"
                        mode="horizontal"
                        onClick={handleMenuClick}
                        items={menuItems}
                    />

                    <SignedIn>
                        <UserButton />
                    </SignedIn>

                </Flex >
            </Header >

        </>
    )
}
