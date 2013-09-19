SunApp
======
Start your iPhone or Android phone and this app will tell you right after you started it how to get to a sunny place
in Switzerland using public transportation.

Motivation
----------
Do cool stuff with mobile devices and JavaScript.

Data processing flow
--------------------
1. Get device geo location.
1. Find closest/nearest public transport station.
1. Load weather data from server.
1. Some complicated algorithm to find 10 best candidates (sunny place "close" to current location).
1. Call Transport API for each candidate to find fastest connection.
1. Display 5 quickest-to-reach sunny places. Each entry has a detail view.

Implementation
--------------
- The first screen is a launch/progress/start screen that keeps user up to date on what the application is currently
working on in the background.
- [app.js:launch()](app.js#L66): sends a 'launching' event for which [Application.js](app/controller/Application.js)
has an `onLaunching()` method.
- `onLaunching()` hides the Sencha loading indicator and displays the [Launching.js](app/view/Launching.js) view. It
also determines the geo location and calls `onGeoLocationDetermined()` on the controller afterwards.
- This function updates the launching view, sets the current geo location on app,
and calls the Transport API ([TransportApi.js](app/TransportApi.js)) to find closest station.
- The callback of the Transport API call is `onClosestStationDetermined()`on the controller.
- This function again updates the launching view and calls `load()` on the [Stations.js](app/store/Stations.js) store.
- The store uses a specific reader to parse the weather data JSON ([StationReader.js](app/store/StationReader.js)),
fires the 'storeLoaded' event (processed by the controller), and calls its own 'reduceToRelevant' function.
- 'reduceToRelevant' implements the magic algorithm, that isn't all that magic yet,
to find candidates and to pick the relevant ones for the user. It calls the Transport API to get connections
(async/parallel), sets the store data when done, and fires the 'storeFiltered' event right after.
- The event is processed by the controller's `onStoreFiltered()` function. It takes down the launching view and
displays the main navigation view with the stations list instead.

Build Android:
- run "sencha app package build packager.json" in C:\Users\mkessler\git\sun\SunApp
- run "sencha app package run packager.json" in C:\Users\mkessler\git\sun\SunApp

To update local data structure wmo2sbb:
- copy/paste data from https://github.com/marcelstoer/SunApp/blob/bc40afdbf480ec9ec5ef93b89438afb5351a5d9b/wmo2sbb.md into map.xmls
- copy/paste column I into wmo2sbb-excel.txt
- run sed '/Id":""/d' wmo2sbb-excel.txt > wmo2sbb-final.txt
- copy paste date from wmo2sbb-final.txt