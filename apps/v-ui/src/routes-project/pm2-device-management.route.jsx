import { Route } from "react-router-dom";
import { ProtectedElementComp } from "../components/ProtectedElementComp/ProtectedElementComp";
import { Pm2DeviceManagement } from "../views/pm2-device-management";

export const Pm2DeviceManagementRoute = [
    <Route path={`/pm2-device-management`}
        element={
            <ProtectedElementComp
                requiredPermission="default:read"
                element={<Pm2DeviceManagement />}
            />
        }
    />
];
