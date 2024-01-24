const axios = require('axios').default;
const { URL } = require('node:url');
const { getVideoDurationInSeconds } = require('get-video-duration');

axios.interceptors.response.use(
    function (response) {
        return response;
    },
    function (error) {
        return Promise.reject({
            data: error.response.data,
            status: error.response.status,
            headers: error.response.headers,
        });
    }
);

const BASE_URL = 'https://api-f.streamable.com/api/v1';

const endpoints = {
    LOGIN: 'https://ajax.streamable.com/check',
    ME: BASE_URL + '/me',
    SUBSCRIPTION_INFO: BASE_URL + '/me/subscription/info',
    LABELS: BASE_URL + '/labels',
    EXTRACT: function (encodedUrl) {
        return BASE_URL + '/extract?url=' + encodedUrl;
    },
    UPLOAD_FROM_URL: BASE_URL + '/uploads/videos',
    TRANSCODE_FROM_URL: function (videoId) {
        return BASE_URL + '/transcode/' + videoId;
    },
    INIT_UPLOAD_VIDEO: function (fileSize) {
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

    /**
     * Get the currently logged in user's data
     * @returns
     */
    async getCurrentUserData() {
        if (!this.#loggedIn) return console.error('You must be logged in!');

        return (await axios.get(endpoints.ME, { headers: this.#headers })).data;
    }

    /**
     * Upload a video from a given url
     * @param {(URL | String)} url The url of the video file to upload
     */
    async uploadVideoFromURL(url) {
        if (!this.#loggedIn) return console.error('You must be logged in!');
        if (!(url instanceof URL)) url = new URL(url);

        const extractedVideoData = (await axios.get(endpoints.EXTRACT(url.href), { headers: this.#headers })).data;
        if (!extractedVideoData) return console.error('Could not extract video data!');

        const uploadedVideoData = (
            await axios.post(
                endpoints.UPLOAD_FROM_URL,
                {
                    extract_id: extractedVideoData.id,
                    extractor: extractedVideoData.extractor,
                    source: extractedVideoData.source_url,
                    status: 1,
                    title: extractedVideoData.id,
                    upload_source: 'clip',
                },
                { headers: this.#headers }
            )
        ).data;
        if (!uploadedVideoData) return console.error('Could not upload video data!');

        const videoDuration = await getVideoDurationInSeconds(url.href);
        if (typeof videoDuration !== 'number') return console.error('Could not get video duration!');

        return (
            await axios.post(
                endpoints.TRANSCODE_FROM_URL(uploadedVideoData.shortcode),
                {
                    extractor: extractedVideoData.extractor,
                    headers: extractedVideoData.headers,
                    length: videoDuration,
                    mute: false,
                    shortcode: uploadedVideoData.shortcode,
                    thumb_offset: null,
                    title: uploadedVideoData.title,
                    upload_source: uploadedVideoData.upload_source,
                    url: uploadedVideoData.source_url,
                },
                {
                    headers: this.#headers,
                }
            )
        ).data;
    }
}

module.exports = StreamableClient;
