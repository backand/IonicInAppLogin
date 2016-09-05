(function () {
var BKStorage = (function () {
    'use strict';

    var prefix = 'BACKAND';

    function Store (storeName, type) {

        var storageAPI;

        if( ['local', 'session'].indexOf(type) === -1 ) type = 'local';

        if (typeof window !== 'undefined' && typeof window[type + 'Storage'] !== 'undefined') {
            storageAPI = window[type + 'Storage'];
        } else {
            // We can fallback to other solution here inMemory Management
            // It could be cookies if needed
            storageAPI = {
                value: null,
                getItem: function (name, params) {
                    return this.value;
                },
                setItem: function (name, params) {
                    this.value = params;
                },
                removeItem: function (name, params) {
                    this.value = null;
                }
            };
        }

        this.command = function (action, params) {
            return storageAPI[action + 'Item'](prefix + storeName, params || null);
        };
    }

    Store.prototype.get = function () {
        return JSON.parse(this.command('get'));
    };

    Store.prototype.set = function (value) {
        return this.command('set', JSON.stringify(value));
    };

    Store.prototype.clear = function () {
        this.command('set');
        return this;
    };

    return {
        register: function (storeName, type) {
            if(!storeName) {
                throw Error('Invalid Store Name');
            }
            this[storeName] = new Store(storeName, type);
            return this;
        },

        remove: function (storeName) {
            this[storeName].command('remove');
            delete this[storeName];
            return this;
        }
    };

})();
;var http;

var config = {
    apiUrl: 'https://api.backand.com',
    socketUrl: 'https://api.backand.com:4000',
    anonymousToken: null,
    signUpToken: null,
    isManagingHttpInterceptor: true,
    isManagingRefreshToken: true,
    runSigninAfterSignup: true,
    callSignupOnSingInSocialError : true, // tell code to run signup after signIn error because user is not registered to application
    appName: null,
    userProfileName: 'backand_user',
    isMobile: false,
    runSocket: false
};

var EVENTS = {
    SIGNIN: 'BackandSignIn',
    SIGNOUT: 'BackandSignOut',
    SIGNUP: 'BackandSignUp'
};

var socialProviders = {
    github: {name: 'github', label: 'Github', url: 'www.github.com', css: 'github', id: 1},
    google: {name: 'google', label: 'Google', url: 'www.google.com', css: 'google-plus', id: 2},
    facebook: {name: 'facebook', label: 'Facebook', url: 'www.facebook.com', css: 'facebook', id: 3},
    twitter: {name: 'twitter', label: 'Twitter', url: 'www.twitter.com', css: 'twitter', id: 4}
};

function getSocialUrl(providerName, isSignup) {
    var provider = socialProviders[providerName];
    var action = isSignup ? 'up' : 'in';
    return 'user/socialSign' + action +
        '?provider=' + provider.label +
        '&response_type=token&client_id=self&redirect_uri=' + provider.url +
        '&state=';
}

BKStorage.register('token');
BKStorage.register('user');

// get token or error message from url in social sign-in popup
(function () {
    var dataRegex = /\?(data|error)=(.+)/;
    var dataMatch = dataRegex.exec(location.href);
    if (dataMatch && dataMatch[1] && dataMatch[2]) {
        var userData = {};
        userData[dataMatch[1]] = JSON.parse(decodeURI(dataMatch[2].replace(/#.*/, '')));
        window.opener.postMessage(JSON.stringify(userData), location.origin);
    }
}());
;'use strict';

angular.module('backand', [])
    .provider('Backand', function () {

        // Provider functions (should be called on module config block)
        this.getApiUrl = function () {
            return config.apiUrl;
        };

        this.setApiUrl = function (newApiUrl) {
            config.apiUrl = newApiUrl;
            return this;
        };

        this.setSocketUrl = function (newSocketUrl) {
          config.socketUrl = newSocketUrl;
          return this;
        };

        // deprecated
        this.getTokenName = function () {
            return null;
        };

        // deprecated
        this.setTokenName = function () {
            return this;
        };

        this.setAnonymousToken = function (anonymousToken) {
            config.anonymousToken = anonymousToken;
            return this;
        };

        this.setSignUpToken = function (signUpToken) {
            config.signUpToken = signUpToken;
            return this;
        };

        this.setAppName = function (appName) {
            config.appName = appName;
            return this;
        };

        // deprecated
        this.manageDefaultHeaders = function (isManagingDefaultHeaders) {
            return this;
        };

        this.manageHttpInterceptor = function (isManagingHttpInterceptor) {
            config.isManagingHttpInterceptor = isManagingHttpInterceptor == undefined ? true : isManagingHttpInterceptor;
            return this;
        };

        this.manageRefreshToken = function (isManagingRefreshToken) {
            config.isManagingRefreshToken = isManagingRefreshToken == undefined ? true : isManagingRefreshToken;
            return this;
        };

        this.runSigninAfterSignup = function (runSigninAfterSignup) {
            config.runSigninAfterSignup = runSigninAfterSignup == undefined ? true : runSigninAfterSignup;
            return this;
        };

        this.runSocket = function (runSocket) {
          config.runSocket = runSocket == undefined ? false : runSocket;
          return this;
        };

        // $get returns the service
        this.$get = ['BackandAuthService', 'BackandUserService','BackandSocketService', function (BackandAuthService, BackandUserService, BackandSocketService) {
            return new BackandService(BackandAuthService, BackandUserService, BackandSocketService);
        }];

        // Backand Service
        function BackandService(BackandAuthService, BackandUserService, BackandSocketService) {
            var self = this;

            self.EVENTS = EVENTS;

            self.setAppName = function (appName) {
                config.appName = appName;
            };

            self.signin = function (username, password) {
                return BackandAuthService.signin(username, password)
            };

            self.signout = function () {
                return BackandAuthService.signout();
            };

            self.signup = function (firstName, lastName, email, password, confirmPassword, parameters) {
                return BackandAuthService.signup(firstName, lastName, email, password, confirmPassword, parameters);
            };

            self.getSocialProviders = function () {
                return socialProviders;
            };

            self.socialSignin = function (provider, spec) {
                return BackandAuthService.socialSignin(provider, spec)
            };

            self.socialSignup = function (provider, parameters, spec, email) {
                return BackandAuthService.socialSignup(provider, parameters, spec, email)
            };

            self.socialSignInToken = function(provider, token){
                return BackandAuthService.socialSigninWithToken(provider, token)
            }

            self.socialSignInCode = function(provider, code){
                var returnUrl = window.location.origin;

                if(!provider || !code) {
                    throw new Error("provide and code have to be valid values");
                }

                return BackandAuthService.socialSigninWithCode(provider, returnUrl, code);
            }


            self.socialSignUpCode = function(provider, code, username, firstname, lastname){
                if(!provider || !code) {
                    throw new Error("provide and code have to be valid values");
                }
                var returnUrl = window.location.origin;

                return BackandAuthService.socialSignupWithCode(provider, returnUrl, code,
                    username, firstname, lastname);
            }

            self.requestResetPassword = function (email) {
                return BackandAuthService.requestResetPassword(email);
            };

            self.resetPassword = function (newPassword, resetToken) {
                return BackandAuthService.resetPassword(newPassword, resetToken);
            };

            self.changePassword = function (oldPassword, newPassword) {
                return BackandAuthService.changePassword(oldPassword, newPassword)
            };

            self.setIsMobile = function(val){
                config.isMobile = val;
            };

            self.setRunSignupAfterErrorInSigninSocial = function(val){
                config.callSignupOnSingInSocialError = val;
            };

            self.getUserDetails = function (force) {
                return BackandUserService.getUserDetails(force)
            };

            self.getUsername = function () {
                return BackandUserService.getUsername();
            };

            self.getUserRole = function () {
                return BackandUserService.getUserRole();
            };

            self.getToken = function () {
                return BKStorage.token.get();
            };

            // deprecated
            self.getTokenName = function () {
                return null;
            };

            self.getApiUrl = function () {
                return config.apiUrl;
            };

            // deprecated
            self.isManagingDefaultHeaders = function () {
                return null;
            };

            self.isManagingHttpInterceptor = function () {
                return config.isManagingHttpInterceptor;
            };

            self.isManagingRefreshToken = function () {
                return config.isManagingRefreshToken && BKStorage.user.get() && BKStorage.user.get().refresh_token;
            };

            //Socket.io service
            self.isRunSocket = function () {
              return config.runSocket;
            };

            self.socketLogin = function(){
              if(config.runSocket)
                BackandSocketService.login(BKStorage.token.get(), config.anonymousToken, config.appName, config.socketUrl);
            };

            self.on = function(eventName, callback){
              BackandSocketService.on(eventName, callback);
            };

            // backward compatibility
            self.socialSignIn = self.socialSignin;
            self.socialSignUp = self.socialSignup;
        }
    })
    .run(['$injector', function ($injector) {
        $injector.invoke(['$http', function ($http) {
            // Cannot inject http to provider, so doing it here:
            http = $http;
        }]);
        $injector.invoke(['Backand', function (Backand) {
          // Cannot inject http to provider, so doing it here:
          Backand.socketLogin();
        }]);
    }]);
;angular.module('backand')
    .factory('BackandHttpInterceptor', ['$q', 'Backand', 'BackandHttpBufferService', 'BackandAuthService', HttpInterceptor])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('BackandHttpInterceptor');
    }]);

function HttpInterceptor ($q, Backand, BackandHttpBufferService, BackandAuthService) {
    return {
        request: function(httpConfig) {
            // Exclusions
            if (config.isManagingHttpInterceptor
                && httpConfig.url.match(Backand.getApiUrl())
                && !httpConfig.url.match(Backand.getApiUrl() + '/token')) {

                var token = BKStorage.token.get();

                if (token) {
                    httpConfig.headers['Authorization'] = token;
                }

                if (config.anonymousToken) {
                    httpConfig.headers['AnonymousToken'] = config.anonymousToken;
                }
            }

            return httpConfig;
        },

        responseError: function (rejection) {

            if (config.isManagingHttpInterceptor
                && rejection.config.url !== Backand.getApiUrl() + 'token'
                && config.isManagingRefreshToken
                && rejection.status === 401
                && rejection.data
                && rejection.data.Message === 'invalid or expired token') {

                    BackandAuthService.refreshToken(Backand.getUsername());

                    var deferred = $q.defer();

                    BackandHttpBufferService.append(rejection.config, deferred);
                    return deferred.promise;
                }

            return $q.reject(rejection);
        }
    }
}
;angular.module('backand')
    .service('BackandAuthService', ['$q', '$rootScope', 'BackandHttpBufferService', 'BackandSocketService', BackandAuthService]);

function BackandAuthService($q, $rootScope, BackandHttpBufferService, BackandSocketService) {
    var self = this;
    var authenticating = false;
    var NOT_SIGNEDIN_ERROR = 'The user is not signed up to';
    var dummyReturnAddress = 'http://www.backandaaaa.com';

    var urls = {
        signup: '/1/user/signup',
        token: '/token',
        requestResetPassword: '/1/user/requestResetPassword',
        resetPassword: '/1/user/resetPassword',
        changePassword: '/1/user/changePassword',
        socialLoginWithCode: '/1/user/PROVIDER/code',
        socialSingupWithCode: '/1/user/PROVIDER/signupCode',
        socialLoginWithToken: '/1/user/PROVIDER/token'
    };

    // basic authentication

    self.signin = function (username, password) {
        var userData = {
            grant_type: 'password',
            username: username,
            password: password,
            appname: config.appName
        };
        return authenticate(userData)
    };

    self.signout = function () {
        BKStorage.token.clear();
        BKStorage.user.clear();

        BackandHttpBufferService.rejectAll('signed out');
        $rootScope.$broadcast(EVENTS.SIGNOUT);
        return $q.when(true);
    };

    self.signup = function (firstName, lastName, email, password, confirmPassword, parameters) {
        return http({
            method: 'POST',
            url: config.apiUrl + urls.signup,
            headers: {
                'SignUpToken': config.signUpToken
            },
            data: {
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password,
                confirmPassword: confirmPassword,
                parameters: parameters
            }
        }).then(function (response) {
            $rootScope.$broadcast(EVENTS.SIGNUP);

            if (config.runSigninAfterSignup
                && response.data.currentStatus === 1) {
                return self.signin(email, password);
            }

            return response;
        })
    };

    // social authentication
    self.socialSignin = function (provider, spec) {
        return socialAuth(provider, false, spec);
    };

    self.socialSignup = function (provider, parameters, spec, email) {
        self.signupParameters = parameters;
        self.inSocialSignup = true;
        return socialAuth(provider, true, spec, email);
    };

    self.socialSigninWithCode = function (provider, returnUrl, code) {
        if (authenticating) {
            return;
        }

        var authData = {
            "code": code,
            "clientId": '',
            "redirectUri": returnUrl,
            "appName": config.appName
        }

        authenticating = true;
        BKStorage.token.clear();
        return http({
            method: 'POST',
            url: config.apiUrl + urls.socialLoginWithCode.replace('PROVIDER', provider),
            headers: {
                'Content-Type': 'application/json'
            },
            data: authData

        }).then(function (response) {
            if (response.data && response.data.access_token) {
                config.token = 'bearer ' + response.data.access_token;

                BKStorage.token.set(config.token);
                BKStorage.user.set(response.data);

                if (self.loginPromise) {
                    self.loginPromise.resolve(config.token);
                }

                BackandHttpBufferService.retryAll();
                $rootScope.$broadcast(EVENTS.SIGNIN);

                if (config.runSocket)
                    BackandSocketService.login(BKStorage.token.get(), config.anonymousToken, config.appName, config.socketUrl);


            } else if (self.loginPromise) {
                self.loginPromise.reject('token is undefined');
            }
            return response.data;

        }).catch(function (err) {
            if (self.loginPromise) {
                self.loginPromise.reject(err);
            }
            return $q.reject(err.data);

        }).finally(function () {
            authenticating = false;
        });
    }

    self.socialSignupWithCode = function (provider, returnUrl, code, username, firstname, lastname) {
        if (!code || !provider) {
            throw new Error("can't signup without code from provider")
        }

        var authData = {
            "code": code,
            "clientId": '',
            "redirectUri": returnUrl || null,
            "appName": config.appName,
            "firstName": firstname || null,
            "lastName": lastname || null,
            "userName": username || null
        }

        authenticating = true;
        BKStorage.token.clear();
        return http({
            method: 'POST',
            url: config.apiUrl + urls.socialSingupWithCode.replace('PROVIDER', provider),
            headers: {
                'Content-Type': 'application/json'
            },
            data: authData

        }).then(function (response) {
            if (response.data && response.data.access_token) {
                config.token = 'bearer ' + response.data.access_token;

                BKStorage.token.set(config.token);
                BKStorage.user.set(response.data);

                if (self.loginPromise) {
                    self.loginPromise.resolve(config.token);
                }

                BackandHttpBufferService.retryAll();
                $rootScope.$broadcast(EVENTS.SIGNIN);

                if (config.runSocket)
                    BackandSocketService.login(BKStorage.token.get(), config.anonymousToken, config.appName, config.socketUrl);


            } else if (self.loginPromise) {
                self.loginPromise.reject('token is undefined');
            }
            return response.data;

        }).catch(function (err) {
            if (self.loginPromise) {
                self.loginPromise.reject(err);
            }
            return $q.reject(err.data);

        })
    }

    self.socialSigninWithToken = function (provider, token) {
        if (authenticating) {
            return;
        }

        var url = config.apiUrl + urls.socialLoginWithToken.replace('PROVIDER', provider) + "?accessToken=" + encodeURIComponent(token) + "&appName=" + encodeURI(config.appName);
        console.log(url);
        authenticating = true;
        BKStorage.token.clear();
        return http({
            method: 'GET',
            url: url,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            if (response.data && response.data.access_token) {
                config.token = 'bearer ' + response.data.access_token;

                BKStorage.token.set(config.token);
                BKStorage.user.set(response.data);

                if (self.loginPromise) {
                    self.loginPromise.resolve(config.token);
                }

                BackandHttpBufferService.retryAll();
                $rootScope.$broadcast(EVENTS.SIGNIN);

                if (config.runSocket)
                    BackandSocketService.login(BKStorage.token.get(), config.anonymousToken, config.appName, config.socketUrl);


            } else if (self.loginPromise) {
                self.loginPromise.reject('token is undefined');
            }
            return response.data;

        }).catch(function (err) {
            if (self.loginPromise) {
                self.loginPromise.reject(err);
            }
            return $q.reject(err.data);

        }).finally(function () {
            authenticating = false;
        });
    }

    function mobileSocialLoginInner(ref, isSignUp, provider, spec) {
        ref.addEventListener('loadstart', function (e) {
                if (e.url.indexOf(dummyReturnAddress) == 0) { // mean startWith

                    try {
                        ref.close();
                    }
                    catch (err) {
                    }

                    var url = e.url;
                    // handle case of misformatted json from server
                    if (url.indexOf('#') === (url.length - 1)) // last char
                    {
                        url = url.slice(0, url.length - 1);
                    }

                    // error return from server
                    if (url.indexOf('error=') > -1) {
                        // handle case of strange chars in the end of url on login error
                        var urlParsed =  new URL(url);

                        var dataStr = decodeURI(urlParsed.search).split('error=')[1];
                        dataStr = dataStr.replace(/%3A/g, ':').replace(/%2C/g, ',');
                        var userData = JSON.parse(dataStr);
                        userData.message = userData.message ? userData.message.replace(/\+/g, ' ') : '';
                        if (!isSignUp && config.callSignupOnSingInSocialError && userData.message.indexOf(NOT_SIGNEDIN_ERROR) > -1) {  // check is right error
                            socialAuth(provider, true, spec);
                            return;
                        }

                        var rejection = {
                            data: userData.message + ' (signing in with ' + userData.provider + ')'
                        };

                        rejection.error_description = rejection.data;
                        self.loginPromise.reject(rejection);
                        return;
                    }

                    // login is OK
                    var dataStr = decodeURI(url).split('/#/?data=')[1];
                    dataStr = dataStr.replace(/%3A/g, ':').replace(/%2C/g, ',');
                    var userData = JSON.parse(dataStr);
                    userData.message = userData.message ? userData.message.replace(/\+/g, ' ') : '';
                    if (self.inSocialSignup) {
                        self.inSocialSignup = false;
                        $rootScope.$broadcast(EVENTS.SIGNUP);
                    }
                    signinWithToken(userData);
                }
            }
        );
    }

    function socialAuth(provider, isSignUp, spec, email) {

        if (!socialProviders[provider]) {
            throw Error('Unknown Social Provider');
        }

        if (!self.loginPromise)
            self.loginPromise = $q.defer();
        else
            self.signUpPromise = $q.defer();

        if (config.isMobile) {

            var ref = window.open(
                config.apiUrl + '/1/'
                + getSocialUrl(provider, isSignUp)
                + '&appname=' + config.appName + (email ? ("&email=" + email) : '')
                + '&returnAddress=' + dummyReturnAddress,
                'id1',
                spec || 'left=1, top=1, width=600, height=600');

            mobileSocialLoginInner(ref, isSignUp, provider, spec);
        }
        else {
            self.socialAuthWindow = window.open(
                config.apiUrl + '/1/'
                + getSocialUrl(provider, isSignUp)
                + '&appname=' + config.appName + (email ? ("&email=" + email) : '')
                + '&returnAddress=',
                'id1',
                spec || 'left=1, top=1, width=600, height=600');

            window.addEventListener('message', (function (provider, spec) {
                return function (e) {
                    window.removeEventListener('message', arguments.callee);
                    setUserDataFromToken(e, provider, spec)
                }
            })(provider, spec), false);
        }
        return self.loginPromise.promise;
    }

    function setUserDataFromToken(event, provider, spec) {
        console.log(event, provider, spec);
        self.socialAuthWindow.close();
        self.socialAuthWindow = null;

        if (event.origin !== location.origin) {
            return;
        }

        var userData = JSON.parse(event.data);
        if (userData.error) {

            if (config.callSignupOnSingInSocialError && userData.error.message.indexOf(NOT_SIGNEDIN_ERROR) > -1) {  // check is right error
                socialAuth(provider, true, spec);
                return;
            }

            var rejection = {
                data: userData.error.message + ' (signing in with ' + userData.error.provider + ')'
            };
            rejection.error_description = rejection.data;
            self.loginPromise.reject(rejection);

        }
        else if (userData.data) {
            if (self.inSocialSignup) {
                self.inSocialSignup = false;
                $rootScope.$broadcast(EVENTS.SIGNUP);
            }
            return signinWithToken(userData.data);

        }
        else {
            self.loginPromise.reject();
        }
    }

    // tokens authentication
    function signinWithToken(userData) {
        var tokenData = {
            grant_type: 'password',
            accessToken: userData.access_token,
            appName: config.appName
        };

        if (self.signupParameters) {
            tokenData.parameters = self.signupParameters;
            self.signupParameters = null;
        }

        return authenticate(tokenData)
    }

    self.refreshToken = function (username) {
        BKStorage.token.clear();

        var user = BKStorage.user.get();
        var refreshToken;
        if (!user || !(refreshToken = BKStorage.user.get().refresh_token)) {
            return;
        }

        var tokenData = {
            grant_type: 'password',
            refreshToken: refreshToken,
            username: username,
            appName: config.appName
        };
        return authenticate(tokenData);
    };


    function authenticate(authData) {
        if (authenticating) {
            return;
        }
        authenticating = true;
        BKStorage.token.clear();
        return http({
            method: 'POST',
            url: config.apiUrl + urls.token,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            transformRequest: function (obj) {
                var str = [];
                angular.forEach(obj, function (value, key) {
                    str.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
                });
                return str.join("&");
            },
            data: authData

        }).then(function (response) {
            if (response.data && response.data.access_token) {
                config.token = 'bearer ' + response.data.access_token;

                BKStorage.token.set(config.token);
                BKStorage.user.set(response.data);

                if (self.loginPromise) {
                    self.loginPromise.resolve(config.token);
                }
                if (self.signUpPromise){
                    self.signUpPromise.resolve(config.token);
                }

                BackandHttpBufferService.retryAll();
                $rootScope.$broadcast(EVENTS.SIGNIN);

                if (config.runSocket)
                    BackandSocketService.login(BKStorage.token.get(), config.anonymousToken, config.appName, config.socketUrl);


            } else if (self.loginPromise) {
                self.loginPromise.reject('token is undefined');
            }
            return response.data;

        }).catch(function (err) {
            if (self.loginPromise) {
                self.loginPromise.reject(err);
            }
            return $q.reject(err.data);

        }).finally(function () {
            authenticating = false;
        });
    }


    // password management

    self.requestResetPassword = function (email) {
        return http({
            method: 'POST',
            url: config.apiUrl + urls.requestResetPassword,
            data: {
                appName: config.appName,
                username: email
            }
        })
    };

    self.resetPassword = function (newPassword, resetToken) {
        return http({
            method: 'POST',
            url: config.apiUrl + urls.resetPassword,
            data: {
                newPassword: newPassword,
                resetToken: resetToken
            }
        });
    };

    self.changePassword = function (oldPassword, newPassword) {
        return http({
            method: 'POST',
            url: config.apiUrl + urls.changePassword,
            data: {
                oldPassword: oldPassword,
                newPassword: newPassword
            }
        });
    };


}
;(function () {
    angular.module('backand').service('BackandHttpBufferService', HttpBufferService);

        function HttpBufferService() {
        var self = this;
        var buffer = [];

        function retryHttpRequest(config, deferred) {
            function successCallback(response) {
                deferred.resolve(response);
            }
            function errorCallback(response) {
                deferred.reject(response);
            }

            http(config).then(successCallback, errorCallback);
        }

        self.append = function (config, deferred) {
            buffer.push({
                config: config,
                deferred: deferred
            });
        };

        self.rejectAll = function (reason) {
            if (reason) {
                for (var i = 0; i < buffer.length; ++i) {
                    buffer[i].deferred.reject(reason);
                }
            }
            buffer = [];
        };

        function updater (config) {
            delete config.headers.Authorization;
            return config;
        }

        self.retryAll = function () {
            for (var i = 0; i < buffer.length; ++i) {
                retryHttpRequest(updater(buffer[i].config), buffer[i].deferred);
            }
            buffer = [];
        }

    }

})();
;/**
 * Created by Itay on 11/17/15.
 */
angular.module('backand')
    .service('BackandSocketService', ['$rootScope', BackandSocketService]);

function BackandSocketService ($rootScope) {

  var self = this;

  self.socket = {on: function(){}}; //io.connect('http://localhost:4000');

  self.login = function(token, anonymousToken, appName, url){
    self.socket = io.connect(url, {'forceNew':true });

    self.socket.on('connect', function(){
      console.log('connected');
      self.socket.emit("login", token, anonymousToken, appName);
    });

    self.socket.on('disconnect', function() {
        console.log('disconnect');
    });

    self.socket.on('reconnecting', function() {
      console.log('reconnecting');
    });

  };

  self.on = function (eventName, callback) {
    self.socket.on(eventName, function () {
      var args = arguments;
      $rootScope.$apply(function () {
        callback.apply(self.socket, args);
      });
    });
  };

  self.emit = function (eventName, data, callback) {
    self.socket.emit(eventName, data, function () {
      var args = arguments;
      $rootScope.$apply(function () {
        if (callback) {
          callback.apply(self.socket, args);
        }
      });
    })
  }
};angular.module('backand').service('BackandUserService', ['$q', BackandUserService]);

function BackandUserService ($q) {
    var self = this;

    self.getUserDetails = function (force) {
        var deferred = $q.defer();
        if (force) {
            http({
                method: 'GET',
                url: config.apiUrl + '/api/account/profile'
            })
                .success(function (profile) {
                    BKStorage.user.set(angular.extend(BKStorage.user.get(), profile));
                    deferred.resolve(BKStorage.user.get());
                })
        } else {
            deferred.resolve(BKStorage.user.get());
        }
        return deferred.promise;
    };

    self.getUsername = function () {
        var userDetails;
        return (userDetails = BKStorage.user.get()) ? userDetails.username : null;
    };

    self.getUserRole = function () {
        var userDetails;
        return (userDetails = BKStorage.user.get()) ? userDetails.role : null;
    };

}
})();
