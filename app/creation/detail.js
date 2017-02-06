import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default class Detail extends Component {

  constructor(props) {
    super(props);
    console.log(this.props);
  }

  render() {
    var row = this.props.row
    return (
      <View style={styles.container}>
        <Text onPress={() => this._back()}>详情页面{row._id}</Text>
      </View>
      )
  }

  _back() {
    this.props.navigator.pop()
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});