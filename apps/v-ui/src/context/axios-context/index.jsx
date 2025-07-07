import { createContext, useContext, useEffect } from "react";
//import { useMessageContext } from "../message-context";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";


axios.defaults.baseURL = import.meta.env.VITE_REACT_APP_API_URL;

export const AxiosContext = createContext({});

export const AxiosContextProvider = ({ children }) => {
    const auth = useAuth();
    useEffect(() => {

        axios.interceptors.request.use((config) => {
            // Add the Authorization header dynamically if needed
            // const token = auth?.user?.access_token;
            let token = "";
            if (auth?.isSignedIn === true && auth?.isLoaded === true) {
                let cookieParsed = document.cookie.split('; ').reduce((prev, current) => {
                    const [name, ...value] = current.split('=');
                    prev[name] = value.join('=');
                    return prev;
                }, {});
                token = cookieParsed.__session;
            }
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                config.headers["Content-Type"] = "application/json; charset=utf-8";
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
    }, [auth]);
    //const { messageApi } = useMessageContext();
    // const [isFetching, setIsFetching] = useState(false);

    const handler = async (type, ...args) => {
        let result = {};

        try {
            const response = await type(...args);
            result = { data: response.data };
        } catch (err) {
            result = { err: err?.response?.data?.message || err.message }
            //messageApi.error(result.err);
        }

        return result;
    }

    const deleteData = async (url) => {
        return await handler(axios.delete, url)
    };

    const patchData = async (url, body) => {
        return await handler(axios.patch, url, body)
    };

    const postData = async (url, body) => {
        return await handler(axios.post, url, body)
    };

    const getData = async (url, options = {}) => {
        return await handler(axios.get, url, options);
    };


    return <AxiosContext.Provider value={{ deleteData, patchData, postData, getData, isFetching: false }}>
        {children}
    </AxiosContext.Provider>
}

export const useAxiosContext = () => useContext(AxiosContext);


//if (auth?.user?.access_token) {
//axios.defaults.headers.common['Authorization'] = `Bearer ${auth?.user?.access_token}`;
//axios.defaults.headers.common['Content-Type'] = `application/json; charset=utf-8`;
//}