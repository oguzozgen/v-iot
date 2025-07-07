import { Route } from "react-router-dom";
import { ProtectedElementComp } from "../components/ProtectedElementComp/ProtectedElementComp";
import { Metrics } from "../views/metrics";

export const MetricsRoute = [
    <Route path={`/metrics`}
        element={
            <ProtectedElementComp
                requiredPermission="default:read"
                element={<Metrics />}
            />
        }
    />

];