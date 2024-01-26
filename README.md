<p align="center">
  <img src="https://raw.githubusercontent.com/madkarmaa/streamable.js/main/images/logo.png" alt="logo" style="width: auto; height: 100px"><br><br><span>NodeJS client to interact with the <a href="https://streamable.com">Streamable</a> API</span>
</p>

> [!IMPORTANT]
>
> **Not compatible with browsers** because they restrict the access to the `Set-Cookie` request header, which is vital for the client to keep the user logged in, since it contains the session cookies.

> [!CAUTION]
>
> The use of this library is against the Streamable's **[Terms of Service](https://terms.streamable.com)**, specifically in [this line](https://terms.streamable.com/#:~:text=Use%20automated,Content), so use it at your own risk.

## ⚙️ Installation

```
npm install github:madkarmaa/streamable.js
```

## ❓ How to

Once the package is installed, you can import the library:

```js
const StreamableClient = require('streamablejs');
```

### Basic usage

```js
const StreamableClient = require('streamablejs');

// Create an instance of the Streamable client
const client = new StreamableClient();

// Start a new client session using your account credentials
client.login('example@email.com', 'examplePassword').then(async () => {
    // your code here...
});
```

## [📖 Docs](https://github.com/madkarmaa/streamable.js/blob/main/docs/DOCS.md)
