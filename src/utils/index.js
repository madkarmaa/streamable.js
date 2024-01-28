const { getRandomValues } = require('node:crypto');

// https://stackoverflow.com/a/26528271

const Password = {
    _pattern: /[a-zA-Z0-9_\-\+\.]/,

    _getRandomByte: function () {
        let result = new Uint8Array(1);
        getRandomValues(result);
        return result[0];
    },

    generate: function (length) {
        return Array.apply(null, { length: length })
            .map(function () {
                var result;
                while (true) {
                    result = String.fromCharCode(this._getRandomByte());
                    if (this._pattern.test(result)) return result;
                }
            }, this).join(''); // prettier-ignore
    },
};

const Email = {
    _pattern: /[a-zA-Z0-9]/,

    _getRandomByte: function () {
        let result = new Uint8Array(1);
        getRandomValues(result);
        return result[0];
    },

    generate: function () {
        const emails = ['yahoo.com', 'gmail.com', 'hotmail.com', 'live.com', 'outlook.com'];
        const randomEmail = emails[Math.floor(Math.random() * emails.length)];

        return (
            Array.apply(null, { length: 16 })
                .map(function () {
                    var result;
                    while (true) {
                        result = String.fromCharCode(this._getRandomByte());
                        if (this._pattern.test(result)) return result;
                    }
                }, this).join('') + '@' + randomEmail // prettier-ignore
        );
    },
};

module.exports = { Password, Email };
