const BASE_URL = 'https://api-f.streamable.com/api/v1';
const AUTH_BASE_URL = 'https://ajax.streamable.com';

const endpoints = {
    LOGIN: AUTH_BASE_URL + '/check',
    SIGNUP: AUTH_BASE_URL + '/users',
    ME: BASE_URL + '/me',
    SUBSCRIPTION_INFO: BASE_URL + '/me/subscription/info',
    LABELS: BASE_URL + '/labels',
    EXTRACT: (encodedUrl) => BASE_URL + '/extract?url=' + encodedUrl,
    UPLOAD_FROM_URL: BASE_URL + '/uploads/videos',
    TRANSCODE_VIDEO: (videoId) => BASE_URL + '/transcode/' + videoId,
    INIT_UPLOAD_LOCAL_VIDEO: (fileSize) => BASE_URL + '/uploads/shortcode?size=' + fileSize + '&version=unknown',
    VIDEOS: BASE_URL + '/videos?sort=date_added',
    VIDEO: (shortcode) => BASE_URL + '/videos/' + shortcode,
    RENAME_VIDEO: (shortcode) => BASE_URL + '/videos/' + shortcode + '/rename',
    INIT_VIDEO: (shortcode) => BASE_URL + '/videos/' + shortcode + '/initialize',
    TRACK_UPLOAD: (shortcode) => BASE_URL + '/uploads/' + shortcode + '/track',
};

module.exports = endpoints;
