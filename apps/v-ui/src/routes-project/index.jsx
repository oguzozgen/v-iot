import { Route, Routes } from "react-router-dom";
import ErrorPage from "../views/error-page";
import { HomeRoute } from "./home.route";
import { Home } from "../views/home";
import AccessDeniedPage from "../views/access-denied";
import { VehicleRegistriesRoute } from "./vehicle-registries.route";
import { TasksRoute } from "./tasks.route";
import { DevicesRoute } from "./devices.route";
import { WatchTowersRoute } from "./watch-tower";
import { Pm2DeviceManagementRoute } from "./pm2-device-management.route";
import { MetricsRoute } from "./metrics";

export default function RoutesProject({ children }) {

    const publicUrl = import.meta.env.VITE_PUBLIC_URL;
    console.log("Public URL:", publicUrl);
    let allRouteComponents = [
        { "key": "HomeRoute", "component": HomeRoute, },
        { "key": "VehicleRegistriesRoute", "component": VehicleRegistriesRoute, },
        { "key": "TasksRoute", "component": TasksRoute, },
        { "key": "DevicesRoute", "component": DevicesRoute, },
        { "key": "WatchTowersRoute", "component": WatchTowersRoute, },
        { "key": "Pm2DeviceManagementRoute", "component": Pm2DeviceManagementRoute, },
        { "key": "MetricsRoute", "component": MetricsRoute, },
    ];

    return (
        <>
            <Routes>
                <Route path={"/"} element={<Home />} />
                <Route path="*" element={<ErrorPage />} />
                {children}
                {allRouteComponents.map(i => i.component)}
                <Route path="/access-denied" element={<AccessDeniedPage />} />
            </Routes>
        </>
    );
}