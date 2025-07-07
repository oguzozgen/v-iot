import { Alert, Button, Spin } from 'antd';
import { useEffect } from 'react';
import useClerkAuth from '../../hooks/useClerkAuth';

export const ProtectedAppComp = ({ children, currentUserRoles, setCurrentUserRoles }) => {
    const auth = useClerkAuth();
    //const [hasTriedSignin, setHasTriedSignin] = useState(false);

    useEffect(() => {
        if (auth.isAuthenticated && (!currentUserRoles || (currentUserRoles && Array.isArray(currentUserRoles) && currentUserRoles.length === 0))) {
            let currentUserIDPRoles = [];
            let dataRoles = auth.user?.profile["userRoles"] || [];
            if (dataRoles && Array.isArray(dataRoles) && dataRoles.length > 0) {
                currentUserIDPRoles = auth.user?.profile["userRoles"];
                setCurrentUserRoles(currentUserIDPRoles);
            } else if (dataRoles && typeof dataRoles === "object" && Object.keys(dataRoles).length > 0) {
                currentUserIDPRoles = Object.keys(dataRoles);
                setCurrentUserRoles(currentUserIDPRoles);
            }
        }
    }, [auth, currentUserRoles, setCurrentUserRoles]);

    if (auth.isLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (auth.error) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <h1 style={{ fontSize: '50px', color: '#ff4d4f' }}>Something went wrong</h1>
                <Alert
                    message="Error"
                    description={auth.error.message || "Unknown error occurred."}
                    type="error"
                    showIcon
                    style={{ marginBottom: 20, width: '80%' }}
                />
                <Button type="primary" onClick={() => window.location.reload()} style={{ width: '200px' }}>Try Again</Button>
            </div>
        );
    }

    if (auth.isAuthenticated) {
        return children;
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h1 style={{ fontSize: '50px', color: '#ff4d4f' }}>We've hit a snag</h1>
            <Alert
                type="error"
                message={"Unable to sign in"}
                description={"Please check your login details or try again later."}
                showIcon
                style={{ marginBottom: 20, width: '80%' }}
            />
            <Button type="primary" onClick={() => auth.signOut()} style={{ width: '200px' }}>Sign In</Button>
        </div>
    );
};
