

const env = 'local';

const urls = {
    local: 'http://localhost:3070',
    dev: 'https://v-iot.dasrc.com',
}

const serverAddress = {
    local: 'http://localhost:3070',
    dev: 'https://v-iot.dasrc.com',
}

const openIdConnect = {
    local: {
        client_id: "291560057802418666",
        client_id_back_end: "296784383594005891",
        post_logout_redirect_uri: "http://localhost:3000/",
        redirect_uri: "http://localhost:3000/",
        clerkFrontEndApi: "https://supreme-pegasus-22.clerk.accounts.dev",
        clerkPublishableKey: "pk_test_c3VwcmVtZS1wZWdhc3VzLTIyLmNsZXJrLmFjY291bnRzLmRldiQ"
    },
    dev: {
        client_id: "291324068374856384",
        client_id_back_end: "296798195202196867",
        redirect_uri: "'https://v-iot.dasrc.com/",
        post_logout_redirect_uri: "'https://v-iot.dasrc.com/login",
        clerkFrontEndApi: "https://supreme-pegasus-22.clerk.accounts.dev",
        clerkPublishableKey: "pk_test_c3VwcmVtZS1wZWdhc3VzLTIyLmNsZXJrLmFjY291bnRzLmRldiQ"
    }
};

export default {
    env: env,
    apiUrl: urls[env],
    serverAddress: serverAddress[env],
    openId: openIdConnect[env],
    authentication: {
        // should be the ui domain address
        redirectUri: env === "local" ? "http://localhost:3000" : urls[env] + "/",
    }
}