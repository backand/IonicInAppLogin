## Backand social with InApp social login

[Backand](https://www.backand.com) and [ionic](www.ionicframework.com) example of an application with social facebook login.
 This application allow user to use InApp facebook if is a mobile device.
 For that I am using [phonegap-facebook-login](https://github.com/Wizcorp/phonegap-facebook-plugin)
 

Login code can be found at controller.js:

For mobile: 
<br/>
<code>
     facebookConnectPlugin.login(["public_profile", "email"]
</code>     
For desktop:
<br/>
<code>
     LoginService.socialSignIn('facebook')
</code>

desktop version use redirect mechanism to do authentication over facebook and Backand and go back to user application.
 
##### Starter
To run application be sure you have ionic cli installed, and run:

<code>
     ionic serve
</code>

If you to run it in your android device:

<code>
     ionic run android -l -c
</code>
