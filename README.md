# Bay Area Bikeshare

Bay Area bikeshare locator and route planner. 
Users can browse and search for bikestations near a trip start/end location.

## Features 
Locate bike stations near you! The app opens at the current device location.

![initial screen](http://res.cloudinary.com/adrienne/image/upload/c_scale,w_320/v1519339588/bikeshare/iOS_initial_screen.png)

Search for bikes at start and end destinations. Filter by maximum walking distance to bike station.

![ios search](http://res.cloudinary.com/adrienne/image/upload/c_scale,w_320/v1519339588/bikeshare/iOS_SF_search.png)
![android search](http://res.cloudinary.com/adrienne/image/upload/c_scale,w_310/v1519339588/bikeshare/Android_San_Jose.png)

Click on a bike station to open directions in the Apple or Google maps app!

![android google maps gif](http://res.cloudinary.com/adrienne/image/upload/c_scale,q_60,w_300/v1519340288/bikeshare/googlemapsdirections.gif)

## Technologies
- React Native
- React Native Maps
- Geolib
- Mapbox Polyline

## Testing 
- Run `npm install` first for dependencies.

- Android  
    - Latest version of Google Play Services required.
    - Device must be on API Level 26 or lower.
    - Disable Dev Mode for faster performance.
    - Start and end markers and route line may not render at first. Please wait for program to finish loading before searching.
   
- iOS
    - Xcode testing on iPhone not compatible with beta 11.3.

## Future Deployment
- Performance Optimizations
  - Javascript is especially slow on android. Look into InteractionManager.
  - Images sometimes don't render.
- Add button to toggle all stations on/off.
- Add get current location button.
