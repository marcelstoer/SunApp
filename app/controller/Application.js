Ext.define('SunApp.controller.Application', {
  extend: 'Ext.app.Controller',

  requires: [
    'SunApp.Location', 'SunApp.TransportApi', 'SunApp.view.Launching', 'SunApp.view.LaunchingContainer',
    'Ext.device.Geolocation'
  ],

  config: {
    refs: {
      main: 'mainview',
      overview: 'overview',
      stations: 'stations',
      stationDetail: 'stationDetail'
    },

    control: {
      main: {
        push: 'onMainPush',
        pop: 'onMainPop'
      },
      stations: {
        itemsingletap: 'onStationSelect'
      }
    }
  },

  init: function () {
    Ext.getStore('Stations').on({ storeFiltered: this.onStoreFiltered, scope: this });
    Ext.getStore('Stations').on({ storeLoaded: this.onStoreLoaded, scope: this });
    SunApp.app.on({launching: this.onLaunching, scope: this});
 },

  onMainPush: function (view, item) {
      this.getMain().getNavigationBar().down('#menuButton').setHidden(true);
  },

  onMainPop: function (view, item) {
    this.getMain().getNavigationBar().setTitle(SunApp.app.getCurrentLocation().getClosestPublicTransportStation().name);
    this.getMain().getNavigationBar().down('#menuButton').setHidden(false);
    if (this.stationDetail !== undefined) {
       this.stationDetail.destroy();
    }
  },

  onStationSelect: function (list, index, node, record) {
    this.stationDetail = Ext.create('SunApp.view.StationDetail', { title: record.get('name') });
    this.stationDetail.setRecord(record);
    this.getMain().push(this.stationDetail);
  },

  onLaunching: function () {
    var appLoadingIndicator = Ext.fly('appLoadingIndicator');
    if (appLoadingIndicator !== null) {
        appLoadingIndicator.destroy();
    }
    Ext.Viewport.add(Ext.create('SunApp.view.LaunchingContainer'));

    Ext.device.Geolocation.getCurrentPosition({
      maximumAge: 0,
      allowHighAccuracy: true,
      success: function(position) {
        var lat = position.coords.latitude;
        var long = position.coords.longitude;
        SunApp.app.getController('Application').onGeoLocationDetermined(lat, long);
      },
      failure: function() {
        var noGeoMsg = [
          'Error detecting your geo location, no more details, sorry. ',
          'The option to select your location manually is still missing. Again, sorry.'
        ].join('');
        SunApp.app.getController('Application').displayError(noGeoMsg);
      }
    });

    // Alternative I: setting location statically
//    SunApp.app.getController('Application').onGeoLocationDetermined(47.46342478, 8.95429439);

    // Alternative II: using Ext.util.Geolocation
//    Ext.create('Ext.util.Geolocation', {
//      autoUpdate: false,
//      maximumAge: 0,
//      listeners: {
//        locationupdate: function (geo) {
//          var lat = geo.getLatitude();
//          var long = geo.getLongitude();
//          SunApp.app.getController('Application').onGeoLocationDetermined(lat, long);
//        },
//        locationerror: function () {
//            var noGeoMsg = [
//              'Error detecting your geo location, no more details, sorry. ',
//              'The option to select your location manually is still missing. Again, sorry.'
//            ].join('');
//            SunApp.app.getController('Application').displayError(noGeoMsg);
//          }
//      }
//    }).updateLocation();
  },

  onGeoLocationDetermined: function (lat, long) {
    var launchingView, transportApi, transportApiErrorFunc;

    launchingView = Ext.Viewport.getComponent(0).getComponent(0);
    launchingView.updateMessageForGeoLocationFound(lat, long);
    launchingView.updateMessageForClosestStationStart();

    transportApi = Ext.create('SunApp.TransportApi');
    transportApiErrorFunc = function (response, opts) {
      var transportApiErrorMsg = [
        '<p>Error finding the closest public transport station: ',
        response.statusText,
        ' (',
        response.status,
        ').</p>',
        'The option to select the closest station manually is still missing. Again, sorry.'
      ].join('');
      SunApp.app.getController('Application').displayError(transportApiErrorMsg);
    };

    SunApp.app.setCurrentLocation(Ext.create('SunApp.Location', { lat: lat, long: long }));
    transportApi.getClosestStation(lat, long, this.onClosestStationDetermined, transportApiErrorFunc);
  },

  onClosestStationDetermined: function (station) {
    var launchingView;

    launchingView = Ext.Viewport.getComponent(0).getComponent(0);
    launchingView.updateMessageForClosestStationFound(station.name);

    SunApp.app.getCurrentLocation().setClosestPublicTransportStation({"name": station.name, "id": station.id});
    launchingView.updateMessageForLoadingAllStations();
    Ext.getStore('Stations').load();
  },

  onStoreLoaded: function (numberOfRecords) {
    if (numberOfRecords > 0) {
      Ext.Viewport.getComponent(0).getComponent(0).updateMessageForLoadingAllStationsDone(numberOfRecords);
    } else {
      SunApp.app.getController('Application').displayError('No data weather data available due to technical errors, sorry.');
    }
  },

  onStoreFiltered: function () {
    var mainView, containerView;
    var storeSize = Ext.getStore('Stations').getData().length;

    if (storeSize > 0) {
      mainView = Ext.create('SunApp.view.Main');
      mainView.getNavigationBar().setTitle(SunApp.app.getCurrentLocation().getClosestPublicTransportStation().name);
      Ext.Viewport.removeAll(true, true);
      Ext.Viewport.add(mainView);
    } else {
      var msg = [
        'Sorry, according to our data the sun really does\'t shine currently in Switzerland. ',
        'It\'s overrated anyway...',
        'after all you should Have Sunshine in Your Heart!'
      ].join('');
      this.displayError(msg);
    }
  },

  displayError: function (htmlMsg) {
    var appLoadingIndicator = Ext.fly('appLoadingIndicator');
    if (appLoadingIndicator !== null) {
      appLoadingIndicator.destroy();
    }
    Ext.Viewport.removeAll(true, true);
    Ext.Viewport.add(Ext.create('SunApp.view.Error', {html: htmlMsg}));
  },

  displayDisclaimer: function () {
    this.getMain().push(Ext.create('SunApp.view.DisclaimerContainer'));
  }

});
