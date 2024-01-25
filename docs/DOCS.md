<a name="StreamableClient"></a>

## StreamableClient
Client to interact with the `streamable.com` APInon-email+password authentication methods aren't supported (yet).

**Kind**: global class  

* [StreamableClient](#StreamableClient)
    * [.login(usernameOrEmail, password)](#StreamableClient+login) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.isLoggedIn()](#StreamableClient+isLoggedIn) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.getUserData()](#StreamableClient+getUserData) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.getPlanData()](#StreamableClient+getPlanData) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.getVideosData()](#StreamableClient+getVideosData) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
    * [.hasReachedUploadLimits()](#StreamableClient+hasReachedUploadLimits) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.uploadVideoFromURL(url)](#StreamableClient+uploadVideoFromURL)

<a name="StreamableClient+login"></a>

### streamableClient.login(usernameOrEmail, password) ⇒ <code>Promise.&lt;void&gt;</code>
Create a new session with the given credentials.===== MUST BE THE CALLED BEFORE ANYTHING ELSE =====

**Kind**: instance method of [<code>StreamableClient</code>](#StreamableClient)  

| Param | Type | Description |
| --- | --- | --- |
| usernameOrEmail | <code>String</code> | The username or email of the user |
| password | <code>String</code> | The password of the user |

<a name="StreamableClient+isLoggedIn"></a>

### streamableClient.isLoggedIn() ⇒ <code>Promise.&lt;boolean&gt;</code>
Check if the user is logged in

**Kind**: instance method of [<code>StreamableClient</code>](#StreamableClient)  
<a name="StreamableClient+getUserData"></a>

### streamableClient.getUserData() ⇒ <code>Promise.&lt;object&gt;</code>
Get the currently logged in user's data

**Kind**: instance method of [<code>StreamableClient</code>](#StreamableClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - The user's data  
<a name="StreamableClient+getPlanData"></a>

### streamableClient.getPlanData() ⇒ <code>Promise.&lt;object&gt;</code>
Get the current user's plan's data

**Kind**: instance method of [<code>StreamableClient</code>](#StreamableClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - The user's current plan's data  
<a name="StreamableClient+getVideosData"></a>

### streamableClient.getVideosData() ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Get the current user's videos data

**Kind**: instance method of [<code>StreamableClient</code>](#StreamableClient)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - The current user's videos data  
<a name="StreamableClient+hasReachedUploadLimits"></a>

### streamableClient.hasReachedUploadLimits() ⇒ <code>Promise.&lt;boolean&gt;</code>
Check if the user has reached the current plan's upload limits

**Kind**: instance method of [<code>StreamableClient</code>](#StreamableClient)  
<a name="StreamableClient+uploadVideoFromURL"></a>

### streamableClient.uploadVideoFromURL(url)
Upload a video from a given url

**Kind**: instance method of [<code>StreamableClient</code>](#StreamableClient)  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>URL</code> \| <code>String</code> | The url of the video file to upload |

