import { Route } from "react-router-dom";
import { ProtectedElementComp } from "../components/ProtectedElementComp/ProtectedElementComp";
import { Devices } from "../views/devices";

export const DevicesRoute = [
     <Route path={`/devices`}
        element={
            <ProtectedElementComp
                requiredPermission="default:read"
                element={<Devices />}
            />
        }
    />
   
];