const axios = require('axios').default;
const { URL } = require('node:url');
const { getVideoDurationInSeconds } = require('get-video-duration');
const convert = require('convert-units');
const endpoints = require('./constants/endpoints.js');

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

/**
 * Client to interact with the `streamable.com` API
 *
 * Google/Facebook authentication methods aren't supported (yet).
 */
class StreamableClient {
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
     * @returns {Promise<void>}
     */
    async login(usernameOrEmail, password) {
        const response = await axios.post(
            endpoints.LOGIN,
            {
                username: usernameOrEmail,
                password: password,
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
     * Check if the user is logged in
     * @returns {Promise<boolean>}
     */
    async isLoggedIn() {
        return this.#loggedIn && !!(await this.getUserData())?.user_name;
    }

    /**
     * Get the currently logged in user's data
     * @returns {Promise<object>} The user's data
     */
    async getUserData() {
        if (!(await this.isLoggedIn())) return console.error('You must be logged in to use this method!');
        return (await axios.get(endpoints.ME, { headers: this.#headers })).data;
    }

    /**
     * Get the current user's plan's data
     * @returns {Promise<object>} The user's current plan's data
     */
    async getPlanData() {
        if (!(await this.isLoggedIn())) return console.error('You must be logged in to use this method!');
        return (await axios.get(endpoints.SUBSCRIPTION_INFO, { headers: this.#headers })).data;
    }

    /**
     * Get the current user's videos data
     * @returns {Promise<object[]>} The current user's videos data
     */
    async getVideosData() {
        if (!(await this.isLoggedIn())) return console.error('You must be logged in to use this method!');
        return Array.from((await axios.get(endpoints.VIDEOS, { headers: this.#headers })).data.videos);
    }

    /**
     * Check if the user has reached the current plan's upload limits
     * @returns {Promise<boolean>}
     */
    async hasReachedUploadLimits() {
        if (!(await this.isLoggedIn())) return console.error('You must be logged in to use this method!');

        const {
            limits: {
                storage: { exceeded },
            },
        } = await this.getPlanData();

        const { plan_max_length, plan_max_size } = await this.getUserData();

        const videosData = await this.getVideosData();

        const totalVideosSeconds = videosData.reduce((total, v) => total + v.duration, 0);
        const totalVideosSize = videosData.reduce((total, v) => total + convert(v.size).from('b').to('Gb'), 0);

        return exceeded || totalVideosSeconds > plan_max_length || totalVideosSize > plan_max_size;
    }

    async #willReachUploadLimits(video_size) {
        if (!(await this.isLoggedIn())) return console.error('You must be logged in to use this method!');
    }

    /**
     * Upload a video from a given url
     * @param {URL | String} url The url of the video file to upload
     * @returns {Promise<object>} The uploaded video's data
     */
    async uploadVideoFromURL(url) {
        if (!(await this.isLoggedIn())) return console.error('You must be logged in to use this method!');
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
