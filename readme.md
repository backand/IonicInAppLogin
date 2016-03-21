## Backand social with InApp social login

[Backand](https://www.backand.com) and [ionic](www.ionicframework.com) example of an application with social facebook login.
 This application allow user to use InApp facebook if is a mobile device.
 For that I am using [phonegap-facebook-login](https://github.com/Wizcorp/phonegap-facebook-plugin)
 

Login code can be found at controller.js:

For mobile: 
     facebookConnectPlugin.login(["public_profile", "email"]
     
For desktop:
     LoginService.socialSignIn('facebook')


desktop version use redirect mechanism to do authentication over facebook and Backand and go back to user application.
 