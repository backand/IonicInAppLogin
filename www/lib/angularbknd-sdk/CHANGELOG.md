<a name="1.8.0"></a>
### 1.8.0 (2015-09-17)


#### Features

* **manageHttpInterceptor:** in config stage, tells Backand to manage all necessary authorization and authentication tokens for each request made to Backand
* **isManagingHttpInterceptor:** returns whether Backand manages all necessary authorization and authentication tokens for each request made to Backand
* **manageRefreshToken:** in config stage, tells Backand to manage re-authenticating using a refresh token when the session has expired
* **isManagingRefreshToken:** returns whether Backand manages re-authenticating using a refresh token when the session has expired
* **runSigninAfterSignup:** tells Backand to perform signing in after a user signs up
* **EVENTS:** broadcasting EVENTS.SIGNIN, EVENTS.SIGNOUT, EVENTS.SIGNUP
* **signup:** added parameter for additional data to be sent to Backand
* **socialSignin:** added parameter for configuring sign in pop-up window spec
* **socialSignup:**
  * added parameter for configuring sign in pop-up window spec
  * added parameter for additional data to be sent to Backand


#### Breaking Changes

* **getTokenName:** deprecated
* **setTokenName:** deprecated
* **manageDefaultHeaders:** deprecated, manageHttpInterceptor replaces the functionality
* **isManagingDefaultHeaders:** deprecated, isManagingHttpInterceptor replaces the functionality
* **signin:** removed parameter 'appName'. To set the application name, use setAppName()
* **signup:** removed parameter 'appName'. To set the application name, use setAppName()
* **requestResetPassword:** removed parameter 'appName'. To set the application name, use setAppName()



