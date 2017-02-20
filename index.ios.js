/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

import List from  './app/creation/index';
import Edit from  './app/edit/index';
import Account from  './app/account/index';
import Login from  './app/account/login';

import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TabBarIOS,
  Navigator,
  AsyncStorage
} from 'react-native';

export default class iReactApp extends Component {

  static title = '<TabBarIOS>';
  static description = 'Tab-based navigation.';
  static displayName = 'TabBarExample';

  state = {
    selectedTab: 'edit',
    logined: false,
    user: null
  };

  componentDidMount() {
    this._asyncAppStatus()
  }

  _asyncAppStatus = () => {
    AsyncStorage.getItem('user')
    .then((data) => {
      var user
      var newState = {}

      if (data) {
        user = JSON.parse(data)
      }

      if (user && user.accessToken) {
        newState.user = user
        newState.logined = true
      } else {
        newState.logined = false
      }

      this.setState(newState)

    })
  }

  _afterLogin = (user) => {
    user = JSON.stringify(user)
    AsyncStorage.setItem('user', user)
    .then(() =>{
      this.setState({
        logined: true,
        user: user
      })
    })
  }

  _logout = () => {
    AsyncStorage.removeItem('user')
    this.setState({
      logined: false,
      user: null
    })
  }

  render() {

    if (!this.state.logined) {
      return <Login afterLogin={this._afterLogin}/>
    }

    return (
      <TabBarIOS tintColor="#ee735c">
        <Icon.TabBarItem
          iconName='ios-videocam-outline'
          selectedIconName='ios-videocam'
          selected={this.state.selectedTab === 'list'}
          onPress={() => {
            this.setState({
              selectedTab: 'list',
            });
          }}>
          <Navigator
            initialRoute={{ 
              name: 'list', 
              component: List 
            }}
            configureScene={(route) => {
              return Navigator.SceneConfigs.FloatFromRight
            }}
            renderScene={(route, navigator) => {
              var Component = route.component
              return <Component {...route.params} navigator={navigator} 
                  />
            }}
          />

        </Icon.TabBarItem>

        <Icon.TabBarItem
          iconName='ios-recording-outline'
          selectedIconName='ios-recording'
          selected={this.state.selectedTab === 'edit'}
          onPress={() => {
            this.setState({
              selectedTab: 'edit',
            })
          }}>
          <Edit />
        </Icon.TabBarItem>
        <Icon.TabBarItem
          iconName='ios-more-outline'
          selectedIconName='ios-more'
          selected={this.state.selectedTab === 'account'}
          onPress={() => {
            this.setState({
              selectedTab: 'account',
            });
          }}>
          <Account user={this.state.user} logout={this._logout}/>
        </Icon.TabBarItem>
      </TabBarIOS>
    );
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

AppRegistry.registerComponent('iReactApp', () => iReactApp);
