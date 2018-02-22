import React from 'react';
import { StyleSheet, Text, View, TextInput, Slider, Dimensions,
         Button, Alert, Keyboard, Image, Platform, Linking } from 'react-native';
import MapView from 'react-native-maps';
import { Marker, Callout } from 'react-native-maps';
import GeoLib from 'geolib';

// Initial Location centered at 4th and Market SF
const LATITUDE = 37.785395;
const LONGITUDE = -122.406270;
const LATITUDE_DELTA = 0.008;
const LONGITUDE_DELTA = Dimensions.get("window").width /
                        Dimensions.get("window").height * LATITUDE_DELTA


export default class AppEntry extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stations:[],
      visibleMarkers:[],
      filteredStations: {
        originGreen:[],
        originRed:[],
        destGreen:[],
        destRed:[],
      },
      currLatLong: {
        latitude: null,
        longitude: null,
      },
      origin: "",
      destination: "",
      originLatLong: {
        latitude: null,
        longitude: null,
      },
      destLatLong: {
        latitude: null,
        longitude: null
      },
      originMarker: null,
      destMarker:null,
      distance: .25,
      mapRegion: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA
      }
    };
  }
  componentWillMount() {
    this.getCurrentLocation();
    this.getStationsList();
  }

  getStationsList() {
    return fetch('http://www.bayareabikeshare.com/stations/json')
      .then( response => response.json())
      .then( responseJson => {
        this.setState({stations: responseJson.stationBeanList,
                      visibleMarkers: responseJson.stationBeanList});
      })
      .catch( e => {
        console.error(e);
        Alert.alert("Unable to get station list.");
      });
  }

  showAllStations() {
    this.setState({visibleMarkers: this.state.stations})
  }

  reverseGeocode(lat, long, startend) {
    return fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=AIzaSyBhefrSLN4CxA-AO4AtzhcBB1P4YEnWkpE`)
      .then(response => {
        if (response.ok) {
          response.json().then( responseJson => {
            this.setState({[startend]: responseJson.results[0].formatted_address});
          }).catch(e => Alert.alert("Reverse geocode failed, please type in manually."))
        }
        else {
          Alert.alert("Reverse geocode failed, please type in manually.")
        }
      })
      .catch(e => {
        console.error(e);
        Alert.alert("Network error. Please try again.");
      });
  }

  getCurrentLocation() {
    navigator.geolocation.getCurrentPosition( pos => {
      const newRegion = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA
      };
      this.setState({ mapRegion: newRegion,
                      originLatLong: {latitude: pos.coords.latitude,
                                     longitude: pos.coords.longitude},
                      currLatLong: {latitude: pos.coords.latitude,
                                     longitude: pos.coords.longitude}})
      this.reverseGeocode(this.state.mapRegion.latitude, this.state.mapRegion.longitude, "origin");
    },
    err => {
      console.log(err);
      Alert.alert("Fetching current position failed, please type in manually.");
    },
    {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000});
  }

  onRegionChange(mapRegion) {
    this.setState({mapRegion});
  }

  verifyLocations(start, end) {
    Keyboard.dismiss();
    this.confirmValidLocation(start, "origin", false);
    this.confirmValidLocation(end, "destination", true);
  }

  confirmValidLocation(address, posStr, getBikes) {
    return fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyBhefrSLN4CxA-AO4AtzhcBB1P4YEnWkpE`)
      .then(response => {
        if (response.ok && getBikes) {
          response.json().then( responseJson => {
            this.saveLatLong(responseJson, posStr);
            this.makeABMarkers();
            this.filterStations();
            this.updateMapRegion();
        }).catch(e => Alert.alert(`Please enter valid ${posStr} address`))}
        else if (response.ok) {
          response.json().then( responseJson => {
            this.saveLatLong(responseJson, posStr);
        }).catch(e => Alert.alert(`Please enter valid ${posStr} address`))}
        else {
          Alert.alert(`Please enter valid ${posStr} address`);
        }
      })
      .catch( e => {
        console.error(e);
        Alert.alert("Network error. Please try again.");
      });
  }

  saveLatLong(response, posStr) {
    const key = posStr === "origin" ? "originLatLong" : "destLatLong";
    const lat = response.results[0].geometry.location.lat
    const long = response.results[0].geometry.location.lng

    this.setState({[key]: {latitude: lat,
                          longitude: long}});
  }

  makeABMarkers() {
    this.setState({visibleMarkers:[]})

    // make origin marker
    originMarker = <Marker
        key={"originMarker"}
        coordinate={this.state.originLatLong}
        image={require('./assets/Amarker.png')}
    />
    this.setState({originMarker});

    // make destination marker
    destMarker = <Marker
        key={"destMarker"}
        coordinate={this.state.destLatLong}
        image={require('./assets/Bmarker.png')}
    />
    this.setState({destMarker});
  }

  filterStations() {
    const originGreen = [];
    const originRed = [];
    const destGreen = [];
    const destRed = [];

    this.state.stations.forEach(station => {
      const stationLat = station.latitude;
      const stationLong = station.longitude;
      const stationLatLong = {latitude: stationLat, longitude: stationLong};

      const distfromOrigin = this.calcDistance(this.state.originLatLong, stationLatLong);
      const distfromDest = this.calcDistance(this.state.destLatLong, stationLatLong);

      if (distfromOrigin <= this.state.distance) {
        if (station.availableBikes > 0) {
          originGreen.push(station);
        } else {
          originRed.push(station);
        }
      } else if (distfromDest <= this.state.distance) {
        if (station.availableDocks > 0) {
          destGreen.push(station);
        } else {
          destRed.push(station);
        }
      }
    })
    const filteredStations = {
      originGreen,
      originRed,
      destGreen,
      destRed
    }
    this.setState({filteredStations})
  }

  updateMapRegion() {
    const center = GeoLib.getCenter([this.state.originLatLong, this.state.destLatLong]);
    const radius = this.calcDistance({latitude:center.latitude, longitude:center.longitude}, this.state.destLatLong);

    const newRegion = {
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta: radius/69 * 2.5,
      longitudeDelta: Dimensions.get("window").width /
                              Dimensions.get("window").height * (radius/69 * 2.5)
    };

    this.setState({mapRegion: newRegion});
  }

  calcDistance(aLatLong, bLatLong) {
    const dist = GeoLib.getDistance(aLatLong, bLatLong);
    return GeoLib.convertUnit('mi', dist);
  }

  openDirections(latS, longS, latD, longD) {
    Platform.select({
      ios: () => {
          Linking.openURL(`http://maps.apple.com/?saddr=${latS},${longS}&daddr=${latD},${longD}&dirflg=w`)
                 .catch(e => Alert.alert('Link not valid'));
      },
      android: () => {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${latS},${longS}&destination=${latD},${longD}&travelmode=walking`)
                 .catch(e => Alert.alert('Link not valid'));
      }
    })();
  }

  render() {
    return(
      <View style={styles.container}>
        <View style={styles.welcomeContainer}>
          <Text style ={styles.headerText}>
            Bay Area Bikeshare
          </Text>
        </View>
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput style={styles.inputText}
              placeholder="Add origin"
              value={this.state.origin}
              onChangeText={ origin => this.setState({origin})}
              clearTextOnFocus={true}
            />
          </View>
          <View style={styles.inputRow}>
            <TextInput style={styles.inputText}
              placeholder="Add destination"
              value={this.state.destination}
              onChangeText={ destination => this.setState({destination})}
            />
          </View>
          <Slider
            step={.25}
            maximumValue={2}
            value={this.state.distance}
            onValueChange={ distance => this.setState({distance})}
          />
          <Text> Maximum walking distance (mi): {this.state.distance} </Text>
          <View style={styles.buttonContainer}>
            <Button style={styles.button}
              onPress={() =>
                this.verifyLocations(this.state.origin, this.state.destination)
              }
              title="Find bikes on route!"
            />
            {/*<Button style={styles.button}
              onPress={() => this.showAllStations()}
              title="Show all stations"
            />*/}
          </View>
        </View>

      <View style={styles.mapContainer}>
        <MapView style={styles.map}
          region={this.state.mapRegion}
          onRegionChange={() => this.onRegionChange()}
        >

        {/* render all initial stations */}
        {this.state.visibleMarkers.map( station => (
          <Marker
            key={station.id}
            coordinate={station}>
              <Callout>
                <View style={styles.callout}>
                  <Text>{station.stAddress1}</Text>
                  <Button
                    onPress={() => this.openDirections(this.state.currLatLong.latitude,
                                                       this.state.currLatLong.longitude,
                                                       station.latitude,
                                                       station.longitude)}
                    title="Directions to here"
                  />
                </View>
              </Callout>
          </Marker>
        ))}

        {/* render origin and destination A, B markers */}
        {this.state.originMarker}
        {this.state.destMarker}

        {/* render green origin markers for bikes stations with bikes */}
        {this.state.filteredStations.originGreen.map(station => (
          <Marker
            key={station.id + 'originGreen'}
            coordinate={station}
            pinColor='green'>
            <Callout>
              <View style={styles.callout}>
                <Text>{station.stAddress1}</Text>
                <Button
                  onPress={() => this.openDirections(this.state.originLatLong.latitude,
                                                     this.state.originLatLong.longitude,
                                                     station.latitude,
                                                     station.longitude)}
                  title="Directions to here"
                />
              </View>
            </Callout>
          </Marker>
        ))}

        {/* render red origin markers for empty bike stations */}
        {this.state.filteredStations.originRed.map(station => (
          <Marker
            key={station.id + 'originRed'}
            coordinate={station}
            pinColor='red'>
            <Callout>
              <View style={styles.callout}>
                <Text>{station.stAddress1}</Text>
                <Button
                  onPress={() => this.openDirections(this.state.originLatLong.latitude,
                                                     this.state.originLatLong.longitude,
                                                     station.latitude,
                                                     station.longitude)}
                  title="Directions to here"
                />
              </View>
            </Callout>
          </Marker>
        ))}

        {/* render green destination markers for bike stations with open docks */}
        {this.state.filteredStations.destGreen.map(station => (
          <Marker
            key={station.id + 'destGreen'}
            coordinate={station}
            pinColor='green'>
            <Callout>
              <View style={styles.callout}>
                <Text>{station.stAddress1}</Text>
                <Button
                  onPress={() => this.openDirections(station.latitude,
                                                     station.longitude,
                                                     this.state.destLatLong.latitude,
                                                     this.state.destLatLong.longitude)}
                  title="Directions from here"
                />
              </View>
            </Callout>
          </Marker>
        ))}

        {/* render red distination markers for bike stations with full docks */}
        {this.state.filteredStations.destRed.map(station => (
          <Marker
            key={station.id + 'destRed'}
            coordinate={station}
            pinColor='red'>
            <Callout>
              <View style={styles.callout}>
                <Text>{station.stAddress1}</Text>
                <Button
                  onPress={() => this.openDirections(station.latitude,
                                                     station.longitude,
                                                     this.state.destLatLong.latitude,
                                                     this.state.destLatLong.longitude)}
                  title="Directions from here"
                />
              </View>
            </Callout>
          </Marker>
        ))}

        </MapView>
      </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    marginTop: 35,
    alignItems: 'center'
  },
  headerText: {
    fontSize: 20,
  },
  inputContainer: {
    flexDirection: 'column',
    flex: 5,
    marginBottom: 3,
    padding: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputText: {
    height: 40,
    width: Dimensions.get('window').width
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  button: {

  },
  mapContainer: {
    flex: 10,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  callout: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});
