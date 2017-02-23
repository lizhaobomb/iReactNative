import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from 'react-native-button';
import request from '../common/request';
import config from '../common/config';
import CountDownText from  '../third/countdown/CountDownText'
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  AlertIOS
} from 'react-native';

export default class Login extends Component {

	constructor(props) {
	  super(props);
	  this.state = {
	  	codeSend: false,
      countingDone: false
	  };
	}

  _countingDone = () => {
    this.setState({
        countingDone: true
      }
    )
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
          ? <View style={styles.verifyCodeBox}>
              <TextInput
                placeholder='输入验证码'
                autoCaptialize={'none'}
                autoCorrect={false}
                keyboardType={'number-pad'}
                style={styles.inputFieldCode}
                onChangeText={(text) => {
                  this.setState({
                    verifyCode:text
                   })
                }} 
              />

              {
                this.state.countingDone
                ? <Button
                    style={styles.countBtn}
                    onPress={this._sendVerifyCode}>获取验证码</Button>
                : <CountDownText
                   style={styles.countBtn}
                   countType='seconds' // 计时类型：seconds / date
                   auto={true} // 自动开始
                   afterEnd={this._countingDone} // 结束回调
                   timeLeft={60} // 正向计时 时间起点为0秒
                   step={-1} // 计时步长，以秒为单位，正数则为正计时，负数为倒计时
                   startText='获取验证码' // 开始的文本
                   endText='获取验证码' // 结束的文本
                   intervalText={(sec) => '剩余秒数' + sec} // 定时的文本回调
                  />
              }                
            </View>
          : null
        }

      	{
      		this.state.codeSend
      		? <Button style={styles.btn} onPress={this._login}>登录</Button>
      		: <Button style={styles.btn} onPress={this._sendVerifyCode}>获取验证码</Button>
      	}
        </View>
      </View>
    )
  }

  _showVerifyCode() {
    this.setState({
      codeSend: true
    })
  }

  _login = () => {
    var phoneNumber = this.state.phoneNumber
    var code = this.state.verifyCode

     if (!phoneNumber) {
      return AlertIOS.alert('电话号码不能为空!')
    }

    if (!code) {
      return AlertIOS.alert('验证码不能为空!')
    }
    var body = {phoneNumber:phoneNumber,verifyCode:code}
    var url = config.api.base + config.api.verify
    request.post(url, body)
    .then((data) => {
      console.log(data)
      if (data && data.success) {
        this.props.afterLogin(data.data)
      } else {
        AlertIOS.alert('登录失败!')
      }
    })
    .catch((error) => {
      AlertIOS.alert('网络错误!')
    })
  }

  _sendVerifyCode = () => {
    this.setState({
      codeSend: true
    })
    /* 测试就不发短信了，浪费
    var phoneNumber = this.state.phoneNumber
    if (!phoneNumber) {
      return AlertIOS.alert('电话号码不能为空!')
    }
    var body = {phoneNumber:phoneNumber}
    var url = config.api.base + config.api.signup
    request.post(url, body)
    .then((data) => {
      if (data && data.success) {
        this._showVerifyCode()
      } else {
        AlertIOS.alert('获取验证码失败!')
      }
    })
    .catch((error) => {
      AlertIOS.alert('网络错误!')
    })  
    */
  }
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
  	borderRadius: 4,
  },

  inputFieldCode: {
    height: 40,
    padding: 5,
    color: '#666',
    fontSize: 16,
    backgroundColor: '#fff',
    borderRadius: 4,
    flex: 1,
  },

  btn: {
  	marginTop: 10,
  	padding: 5,
  	backgroundColor: 'transparent',
  	borderWidth: 1,
  	borderRadius: 4,
  	borderColor: '#ee735c',
  	height: 40,
  	color: '#ee735c'
  },

  verifyCodeBox: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  countBtn: {
    width: 110,
    height: 40,
    padding: 10,
    marginLeft: 8,
    color: '#fff',
    backgroundColor: '#ee735c',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: 15,
  }

});