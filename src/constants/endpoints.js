const BASE_URL = 'https://api-f.streamable.com/api/v1';

const endpoints = {
    LOGIN: 'https://ajax.streamable.com/check',
    SIGNUP: 'https://ajax.streamable.com/users',
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
    VIDEOS: BASE_URL + '/videos?sort=date_added',
    VIDEO: function (shortcode) {
        return BASE_URL + '/videos/' + shortcode;
    },
};

module.exports = endpoints;
