angular.module('SimpleRESTIonic.controllers', [])
  .controller('LoginCtrl', function (Backand, $state, $rootScope, LoginService) {
    var login = this;
    login.facebookToken = '';

    function signin() {
      LoginService.signin(login.email, login.password)
        .then(function () {
          onLogin();
        }, function (error) {
          console.log(error)
        })
    }

    function loginError(err){
      console.log(err);
    }

    login.facebookTokenSingin = function () {
      console.log('start facebook token');
      var fbLoginSuccess = function (userData) {

        facebookConnectPlugin.getAccessToken(function (token) {

          login.facebookToken = token;

          LoginService.facebookToken(login.facebookToken).then(function (d) {
            login.isLoggedWihtBackand = true;
            login.facebookToken = "Here with Backand InAPP! ";
            login.username = d.username;
            login.role = d.role;
          }, loginError);
        });
      }

      var haveInAppPlugin = false;

      try {
        haveInAppPlugin = facebookConnectPlugin;
      }
      catch (err){

      }

      // facebookConnectPlugin is not defined on desktop
      if(haveInAppPlugin) { // mobile
        facebookConnectPlugin.login(["public_profile", "email"], fbLoginSuccess,
          function (error) {
            console.error(error)
          }
        );
      }
      else { // desktop
        LoginService.socialSignIn('facebook').then(function(){
          var username = Backand.getUsername();
          var userRole = Backand.getUserRole();

          login.isLoggedWihtBackand = true;
          login.facebookToken = "Here with Backand! ";
          login.username = username;
          login.role = userRole;
        }, loginError)
      }
    }

    function anonymousLogin() {
      LoginService.anonymousLogin();
      onLogin();
    }

    function onLogin() {
      $rootScope.$broadcast('authorized');
      $state.go('tab.dashboard');
    }

    function signout() {
      LoginService.signout()
        .then(function () {
          //$state.go('tab.login');
          $rootScope.$broadcast('logout');
          $state.go($state.current, {}, {reload: true});
        })

    }

    login.signin = signin;
    login.signout = signout;
    login.anonymousLogin = anonymousLogin;


  })

  .controller('SignUpCtrl', function (Backand, $state, $rootScope, LoginService) {
    var vm = this;


    function signUp() {
      vm.errorMessage = '';
      LoginService.signup(vm.firstName, vm.lastName, vm.email, vm.password, vm.again)
        .then(function (response) {
          // success
          onLogin();
        }, function (reason) {
          if (reason.data.error_description !== undefined) {
            vm.errorMessage = reason.data.error_description;
          }
          else {
            vm.errorMessage = reason.data;
          }
        });

    }

    function signupFacebook() {
      LoginService.socialSignUp('facebook')
        .then(function () {
            onLogin();
          }
          , function (reason) {
            if (reason.data.error_description !== undefined) {
              vm.errorMessage = reason.data.error_description;
            }
            else {
              vm.errorMessage = reason.data;
            }
          });
    }

    function onLogin() {
      $rootScope.$broadcast('authorized');
      $state.go('tabs.dashboard');
    }

    vm.signupFacebook = signupFacebook;
    vm.signup = signUp;
    vm.email = '';
    vm.password = '';
    vm.again = '';
    vm.firstName = '';
    vm.lastName = '';
    vm.errorMessage = '';
  })

  .controller('DashboardCtrl', function (ItemsModel, $rootScope) {
    var vm = this;

    function goToBackand() {
      window.location = 'http://docs.backand.com';
    }

    function getAll() {
      ItemsModel.all()
        .then(function (result) {
          vm.data = result.data.data;
        });
    }

    function clearData() {
      vm.data = null;
    }

    function create(object) {
      ItemsModel.create(object)
        .then(function (result) {
          cancelCreate();
          getAll();
        });
    }

    function update(object) {
      ItemsModel.update(object.id, object)
        .then(function (result) {
          cancelEditing();
          getAll();
        });
    }

    function deleteObject(id) {
      ItemsModel.delete(id)
        .then(function (result) {
          cancelEditing();
          getAll();
        });
    }

    function initCreateForm() {
      vm.newObject = {name: '', description: ''};
    }

    function setEdited(object) {
      vm.edited = angular.copy(object);
      vm.isEditing = true;
    }

    function isCurrent(id) {
      return vm.edited !== null && vm.edited.id === id;
    }

    function cancelEditing() {
      vm.edited = null;
      vm.isEditing = false;
    }

    function cancelCreate() {
      initCreateForm();
      vm.isCreating = false;
    }

    vm.objects = [];
    vm.edited = null;
    vm.isEditing = false;
    vm.isCreating = false;
    vm.getAll = getAll;
    vm.create = create;
    vm.update = update;
    vm.delete = deleteObject;
    vm.setEdited = setEdited;
    vm.isCurrent = isCurrent;
    vm.cancelEditing = cancelEditing;
    vm.cancelCreate = cancelCreate;
    vm.goToBackand = goToBackand;
    vm.isAuthorized = false;

    $rootScope.$on('authorized', function () {
      vm.isAuthorized = true;
      getAll();
    });

    $rootScope.$on('logout', function () {
      clearData();
    });

    if (!vm.isAuthorized) {
      $rootScope.$broadcast('logout');
    }

    initCreateForm();
    getAll();

  })

  .controller('NavCtrl', function ($scope, $ionicSideMenuDelegate) {
    $scope.showMenu = function () {
      $ionicSideMenuDelegate.toggleLeft();
    };
    $scope.showRightMenu = function () {
      $ionicSideMenuDelegate.toggleRight();
    };

    $scope.getUsername = function () {
      return "bla";
    }
  })

  .controller('MenuCtrl', function ($scope, Backand) {
    $scope.getUsername = function () {
      return Backand.getUsername();
    }
  })
  .controller('HomeTabCtrl', function ($scope) {
  });

