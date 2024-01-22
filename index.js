import axios from 'axios';

const BASE_URL = 'https://api-f.streamable.com/api/v1';

const endpoints = {
    LOGIN: 'https://ajax.streamable.com/check',
    ME: BASE_URL + '/me',
    SUBSCRIPTION_INFO: BASE_URL + '/me/subscription/info',
    /**
     * @param {number} fileSize The size of the video file
     * @returns
     */
    UPLOAD_VIDEO: function (fileSize) {
        return BASE_URL + '/uploads/shortcode?size=' + fileSize + '&version=unknown';
    },
};

/**
 * Client to interact with the `streamable.com` API
 *
 * non-email+password authentication methods aren't supported (yet).
 */
class StreamableClient {
    constructor() {}

    #username;
    #password;
    #loggedIn = false;

    #headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        credentials: 'include',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': 'https://streamable.com',
    };

    /**
     * Create a new session with the given credentials.
     *
     * ===== MUST BE THE CALLED BEFORE ANYTHING ELSE =====
     * @param {String} usernameOrEmail The username or email of the user
     * @param {String} password The password of the user
     */
    async login(usernameOrEmail, password) {
        this.#username = usernameOrEmail;
        this.#password = password;

        const response = await axios.post(
            endpoints.LOGIN,
            {
                username: this.#username,
                password: this.#password,
            },
            { headers: this.#headers }
        );

        const cookies = response.headers['set-cookie']
            .map((cookie) => cookie.split(';')[0])
            .filter((cookie) => cookie.split('=')[1])
            .join('; ');

        this.#headers['cookie'] = cookies;
        this.#loggedIn = true;
    }

    async getCurrentUserData() {
        if (!this.#loggedIn) return console.error('You must be logged in!');

        return (await axios.get(endpoints.ME, { headers: this.#headers })).data;
    }
}

export { StreamableClient };
