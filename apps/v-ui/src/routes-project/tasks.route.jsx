import { Route } from "react-router-dom";
import { ProtectedElementComp } from "../components/ProtectedElementComp/ProtectedElementComp";
import { Home } from "../views/home";
import { Tasks } from "../views/tasks";

export const TasksRoute = [
     <Route path={`/tasks`}
        element={
            <ProtectedElementComp
                requiredPermission="default:read"
                element={<Tasks />}
            />
        }
    />
   
];