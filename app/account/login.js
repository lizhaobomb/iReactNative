import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from 'react-native-button';
import request from '../common/request';
import config from '../common/config';

import {
  StyleSheet,
  Text,
  View,
  TextInput,
} from 'react-native';

export default class Login extends Component {

	constructor(props) {
	  super(props);
	
	  this.state = {
	  	codeSend: false
	  };
	}

  render() {
    return (
      <View style={styles.container}>
      	<View style={styles.signupBox}>
        	<Text style={styles.title}>快速登录</Text>
        	<TextInput
        		placeholder='输入手机号'
        		autoCaptialize={'none'}
        		autoCorrect={false}
        		keyboardType={'number-pad'}
        		style={styles.inputField}
        		onChangeText={(text) => {
        			this.setState({
        				phoneNumber:text
        			})
        		}} 
        	/>
        	{
        		this.state.codeSend
        		? <Button style={styles.btn} onPress={this._login}>登录</Button>
        		: <Button style={styles.btn} onPress={this._sendVerifyCode}>获取验证码</Button>
        	} 
      	</View>
      </View>
      )
  }
}

_sendVerifyCode = () => {
	var phoneNumber = this.state.phoneNumber
	console.log(phoneNumber)
	if (!phoneNumber) {
		return AlertIOS.alert('电话号码不能为空!')
	} 
	var body = {phoneNumber:phoneNumber}
	var url = config.api.base + config.api.signup
	request.post(url, body)
	.then((data) => {
		if (data && data.success) {

		} else {
			AlertIOS.alert('获取验证码失败!')
		}
	})
	.catch((error) => {
		AlertIOS.alert('获取验证码失败!' + error)
	})
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },

  signupBox: {
  	marginTop: 30,
  },

  title: {
  	marginBottom: 20,
  	color: '#333',
  	fontSize: 20,
  	textAlign: 'center'
  },

  inputField: {
  	height: 40,
  	padding: 5,
  	color: '#666',
  	fontSize: 16,
  	backgroundColor: '#fff',
  	borderRadius: 4
  },

  btn: {
  	marginTop: 30,
  	padding: 5,
  	backgroundColor: 'transparent',
  	borderWidth: 1,
  	borderRadius: 4,
  	borderColor: '#ee735c',
  	height: 40,
  	color: '#ee735c'
  }

});