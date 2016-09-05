## Backand social with InApp social login

This is an example of using [Backand](https://www.backand.com) and [ionic](www.ionicframework.com) to create an application with social media login. If the application is run on a mobile device, the user can leverage Facebook's InApp authentication to obtain the authentication token. This is implemented using [phonegap-facebook-login](https://github.com/Wizcorp/phonegap-facebook-plugin).

##### Overview
In this project, we demonstrate how to build a device-native login experience using Facebook, Ionic, and Backand. The code, when run on a mobile device, ties in with Facebook's app to perform authentication, and then sends the authorization token to a Backand-powered back-end, allowing the application access to the user's data. You can use this functionality to drive a registration experience that, by tying in with Facebook's native app integration, builds user trust in your platform, leveraging the strengths of a mobile experience effectively.

##### Points of Interest
The pertinent login code can be found in controller.js. There are two versions - one for mobile, and one for desktop/web applications. 

The mobile version leverages a library to perform the native Facebook authentication on the device. This is done using the following code:
<br/>
<code>
    facebookConnectPlugin.login(["public_profile", "email"]
</code>     

The desktop, on the other hand, performs Facebook-based authentication by using Backand's social media login functionality. This is wrapped by the LoginService, which is found in services.js:
<br/>
```bash
    LoginService.socialSignIn('facebook')
```

The crucial difference between the two is the app experience. With the desktop version, registration and login will be conducted via a series of page redirects, taking the user from your application to facebook, then back upon completion of log-in. The mobile version, on the other hand, leverages the Facebook mobile app to perform authentication, supplying the authentication token to Backand once the authentication process is complete.
 
#### Starting the application

To run the application on your local machine, you need to first install [Ionic's Command Line Interface (CLI)](http://ionicframework.com/docs/cli/). Once you have installed the CLI, get the latest code from github:

```
    git clone https://github.com/backand/IonicInAppLogin.git
    cd IonicInAppLogin
```

Run the app by executing the following command from the console:

```
    ionic serve
```

The above command defaults to serving the web version of the application. If you'd like to see it run on an android emulator, use the following command to start the application:

```
    ionic run android -l -c
```
