import { Route } from "react-router-dom";
import { ProtectedElementComp } from "../components/ProtectedElementComp/ProtectedElementComp";
import { Home } from "../views/home";

export const HomeRoute = [
     <Route path={`/home`}
        element={
            <ProtectedElementComp
                requiredPermission="default:read"
                element={<Home />}
            />
        }
    />
   
];