import React from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';
import MapView from 'react-native-maps';
import { Marker } from 'react-native-maps';

export default class Map extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stations: [],

    };
  }



  render() {
    return (
    <View style = {styles.map}>

    </View>
    );
  }
}

const styles = StyleSheet.create({

})
