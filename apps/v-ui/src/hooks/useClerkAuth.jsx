import { useUser, useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const useClerkAuth = () => {
    const { isSignedIn, user } = useUser();
    const auth = useAuth();
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        user: null,
        error: null,
        isLoading: true,
    });

    useEffect(() => {
        if (isSignedIn) {
            let cookieParsed = document.cookie.split('; ').reduce((prev, current) => {
                const [name, ...value] = current.split('=');
                prev[name] = value.join('=');
                return prev;
            }, {});
            let jwt = cookieParsed.__session;
            let decodedJwt = jwtDecode(jwt);
            let clerkVersionPermissions = decodedJwt.org_permissions.map((item) => {
                let splited = item.split(":");
                let merged = splited[1] + ":" + splited[2];
                let dashFix = merged.replace(/_/g, "-");
                return dashFix;
            });
            localStorage.setItem("userRoles", JSON.stringify(clerkVersionPermissions));
            setAuthState({
                isAuthenticated: true,
                user: {
                    access_token: jwt,
                    profile: {
                        ...user,

                        "userRoles": clerkVersionPermissions || [],
                    },
                },
                error: null,
                isLoading: false,
            });
        } else {
            setAuthState({
                isAuthenticated: false,
                user: null,
                error: null,
                isLoading: false,
            });
        }
    }, [isSignedIn, user]);

    return {
        ...authState,
        signOut: auth.signOut,
    };
};

export default useClerkAuth;