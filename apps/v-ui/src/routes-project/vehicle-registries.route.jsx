import { Route } from "react-router-dom";
import { ProtectedElementComp } from "../components/ProtectedElementComp/ProtectedElementComp";
import { VehicleRegistries } from "../views/vehicle-registries";

export const VehicleRegistriesRoute = [
     <Route path={`/vehicle-registries`}
        element={
            <ProtectedElementComp
                requiredPermission="default:read"
                element={<VehicleRegistries />}
            />
        }
    />
   
];