const axios = require('axios').default;
const { URL } = require('node:url');
const { getVideoDurationInSeconds } = require('get-video-duration');
const convert = require('convert-units');
const fs = require('node:fs');
const path = require('node:path');
const { lookup } = require('mime-types');
const endpoints = require('./constants/endpoints.js');
const S3 = require('aws-sdk/clients/s3.js');

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
 * `.login()` or `.createAccount()` methods **must** be called before performing any other operations!
 *
 * @class
 */
class StreamableClient {
    #loggedIn = false;

    _baseHeaders = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        credentials: 'include',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': 'https://streamable.com',
    };

    #headers = {};

    /**
     * Create a new session with the given credentials.
     *
     * **Google/Facebook authentication methods aren't supported** (yet)
     *
     * @param {String} usernameOrEmail The username or email of the user
     * @param {String} password The password of the user
     * @returns {Promise<void>}
     */
    async login(usernameOrEmail, password) {
        this.#loggedIn = false;

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

        this.#headers = { ...this._baseHeaders, cookie: cookies };
        this.#loggedIn = true;
    }

    /**
     * Check if the user is logged in
     *
     * @returns {Promise<boolean>}
     */
    async isLoggedIn() {
        return this.#loggedIn && !!(await axios.get(endpoints.ME, { headers: this.#headers })).data?.user_name;
    }

    /**
     * Get the currently logged in user's data
     *
     * @returns {Promise<object>} The user's data
     */
    async getUserData() {
        if (!(await this.isLoggedIn())) return console.error('You must be logged in to use this method!');
        return (await axios.get(endpoints.ME, { headers: this.#headers })).data;
    }

    /**
     * Get the current user's plan's data
     *
     * @returns {Promise<object>} The user's current plan's data
     */
    async getPlanData() {
        if (!(await this.isLoggedIn())) return console.error('You must be logged in to use this method!');
        return (await axios.get(endpoints.SUBSCRIPTION_INFO, { headers: this.#headers })).data;
    }

    /**
     * Get the current user's videos data
     *
     * @returns {Promise<object[]>} The current user's videos data
     */
    async getAllVideosData() {
        if (!(await this.isLoggedIn())) return console.error('You must be logged in to use this method!');
        return Array.from((await axios.get(endpoints.VIDEOS, { headers: this.#headers })).data.videos);
    }

    /**
     * Get a video's data
     *
     * @param {String} shortcode The shortcode of the video
     * @returns {Promise<object>} The data of the video
     */
    async getVideoData(shortcode) {
        return (await axios.get(endpoints.VIDEO(shortcode), { headers: this.#headers })).data;
    }

    /**
     * Upload a video from a given url
     *
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
                endpoints.TRANSCODE_VIDEO(uploadedVideoData.shortcode),
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

    /**
     * Delete a video from the user's account
     *
     * @param {String} shortcode The shortcode of the video
     * @returns {Promise<void>}
     */
    async deleteVideo(shortcode) {
        try {
            await axios.delete(endpoints.VIDEO(shortcode), { headers: this.#headers });
        } catch (error) {
            if (error.status === 404) return console.error(`Video with shortcode '${shortcode}' not found!`);
        }
    }

    /**
     * Delete all videos from the user's account
     *
     * @returns {Promise<void>}
     */
    async deleteAllVideos() {
        await Promise.all((await this.getAllVideosData()).map((v) => this.deleteVideo(v.shortcode)));
    }

    /**
     * Create a new account with the given credentials and **start a new session**.
     *
     * **Google/Facebook authentication methods aren't supported** (yet)
     *
     * **NOTE**: This method will replace the currently active session (if any)
     *
     * @param {String} usernameOrEmail The username or email of the user
     * @param {String} password The password of the user
     * @returns {Promise<void>}
     */
    async createAccount(usernameOrEmail, password) {
        this.#loggedIn = false;

        const response = await axios.post(endpoints.SIGNUP, {
            email: usernameOrEmail,
            password: password,
            username: usernameOrEmail,
            verification_redirect: 'https://streamable.com?alert=verified',
        });

        const cookies = response.headers['set-cookie']
            .map((cookie) => cookie.split(';')[0])
            .filter((cookie) => cookie.split('=')[1])
            .join('; ');

        this.#headers = { ...this._baseHeaders, cookie: cookies };
        this.#loggedIn = true;
    }

    /**
     * Rename a video's title
     *
     * @param {String} shortcode The shortcode of the video
     * @param {String} newTitle The new title of the video
     * @returns {Promise<void>}
     */
    async renameVideoTitle(shortcode, newTitle) {
        await axios.post(endpoints.RENAME_VIDEO(shortcode), { title: newTitle }, { headers: this.#headers });
    }

    /**
     * Upload a local video
     *
     * @param {String} videoPath The path to the video file
     * @returns {Promise<object>} The uploaded video's data
     */
    async uploadLocalVideo(videoPath) {
        videoPath = path.resolve(videoPath);
        const isVideoValid = await this.isVideoSuitableForUpload(videoPath);

        if (!isVideoValid.isValid) return console.error(isVideoValid.reason);

        const { size: videoSize } = fs.statSync(videoPath);

        const uploadMetaData = (await axios.get(endpoints.INIT_UPLOAD_LOCAL_VIDEO(videoSize), { headers: this.#headers })).data; // prettier-ignore

        if (!uploadMetaData?.fields) return console.error('Cannot retrieve server upload headers!');

        await axios.post(
            endpoints.INIT_VIDEO(uploadMetaData.shortcode),
            {
                original_name: path.basename(videoPath),
                original_size: videoSize,
                title: path.parse(videoPath).name,
                upload_source: 'web',
            },
            { headers: this.#headers }
        );

        function uploadToBucket() {
            return new Promise((resolve, reject) => {
                const clockSkew = uploadMetaData.time ? uploadMetaData.time * 1000 - new Date().getTime() : 0;

                const bucket = new S3({
                    apiVersion: '2006-03-01',
                    region: 'us-east-1',
                    credentials: uploadMetaData.credentials,
                    useAccelerateEndpoint: uploadMetaData.accelerated,
                    maxRetries: 15,
                    systemClockOffset: clockSkew,
                });

                const upload = bucket.upload(
                    {
                        Key: uploadMetaData.key,
                        Body: fs.createReadStream(videoPath),
                        Bucket: uploadMetaData.bucket,
                        ACL: 'public-read',
                    },
                    { queueSize: 3 }, // prettier-ignore
                    (err, data) => {
                        if (err) reject(err);
                        if (data) resolve(data);
                    }
                );
            });
        }

        let awsUploadData;
        try {
            awsUploadData = await uploadToBucket();
        } catch (error) {
            return console.error(error);
        }

        if (!awsUploadData) return console.error('Could not upload to AWS servers!');

        await axios.post(
            endpoints.TRACK_UPLOAD(uploadMetaData.shortcode),
            { event: 'complete' },
            { headers: this.#headers }
        );

        return (
            await axios.post(
                endpoints.TRANSCODE_VIDEO(uploadMetaData.shortcode),
                { ...uploadMetaData.transcoder_options }, // prettier-ignore
                { headers: this.#headers }
            )
        ).data;
    }

    /**
     * Check if a local file is suitable for upload based off the current plan's limitations
     *
     * @param {String} videoPath The path to the video file
     * @return {Promise<{ reason: String, isValid: boolean }>}
     */
    async isVideoSuitableForUpload(videoPath) {
        videoPath = path.resolve(videoPath);

        if (!lookup(videoPath).startsWith('video')) return { reason: 'Not a video', isValid: false };

        const { size: videoSize } = fs.statSync(videoPath);
        const { plan_max_length, plan_max_size } = await this.getUserData();

        if (videoSize > convert(plan_max_size).from('Gb').to('b')) return { reason: 'Video too large', isValid: false };

        if ((await getVideoDurationInSeconds(videoPath)) > plan_max_length)
            return { reason: 'Video too long', isValid: false };

        return { reason: '', isValid: true };
    }
}

module.exports = StreamableClient;
