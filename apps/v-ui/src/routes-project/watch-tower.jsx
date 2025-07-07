import { Route } from "react-router-dom";
import { ProtectedElementComp } from "../components/ProtectedElementComp/ProtectedElementComp";
import { VehicleRegistries } from "../views/vehicle-registries";
import { WatchTower } from "../views/watch-tower";

export const WatchTowersRoute = [
    <Route path={`/watch-towers`}
        element={
            <ProtectedElementComp
                requiredPermission="default:read"
                element={<WatchTower />}
            />
        }
    />

];