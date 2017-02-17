import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-picker'
import Button from 'react-native-button'
import * as Progress from 'react-native-progress';
import request from '../common/request';
import config from '../common/config';

import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Image,
  AsyncStorage,
  AlertIOS,
  Modal,
  TextInput
} from 'react-native';

var width = Dimensions.get('window').width

var photoOptions = {
  title: '选择头像',
  cancelButtonTitle: '取消',
  takePhotoButtonTitle: '拍照',
  chooseFromLibraryButtonTitle: '相册',
  quality: 0.75,
  allowsEditing: true,
  noData: false,
  
  storageOptions: {
    skipBackup: true,
    path: 'images'
  }
}

function avatar(id, type) {
  if (id.indexOf('http') > -1) {
    return id
  }
  if (id.indexOf('data:image') > -1) {
    return id
  }
  if (id.indexOf('avatar/') > -1) {
    return  config.cloudinary.resBase + '/' + type + '/upload/' + id
  }
  return config.qiniu.resBase + id
}

export default class Account extends Component {

  constructor(props) {
    super(props);
    var user = this.props.user || {}
    this.state = {
      user: user,
      avatarProgress: 0,
      avatarUploading: false,
      modalvisible: false
    }
  }

  componentDidMount() {
    AsyncStorage.getItem('user')
    .then((data) => {
      var user
      if (data) {
        user = JSON.parse(data)
      }
      if (user && user.accessToken) {
        this.setState({
          user: user
        })
      }
    })
  }

  render() {
    var user = this.state.user
    return (
      <View style={styles.container}>
        <View style={styles.navigationBar}>
          <Text style={styles.naviTitle}>我的账户</Text>
          <Text style={styles.editText} onPress={this._showModal}>编辑</Text>
        </View>
        {
          user.avatar 
          ? <TouchableOpacity style={styles.avatarContainer} onPress={this._showPicker}>
              <Image source={{uri:avatar(user.avatar, 'image')}} style={styles.avatarContainer}>
                <View style={styles.avatarBox}>
                  {
                    this.state.avatarUploading 
                    ? <Progress.Circle 
                        size={75} 
                        showsText={true}
                        color={'#ee735c'}
                        progress={this.state.avatarProgress}
                        />
                    : <Image
                        source={{uri:avatar(user.avatar, 'image')}}
                        style={styles.avatar} />
                  }
                </View>
                <Text style={styles.avatarTip}>戳这里换头像</Text>
              </Image>
            </TouchableOpacity>
          : <TouchableOpacity style={styles.avatarContainer} onPress={this._showPicker}>
              <Text style={styles.avatarTip}>添加头像</Text>
              <View style={styles.avatarBox}>
              {
                this.state.avatarUploading 
                ? <Progress.Circle 
                    size={75} 
                    showsText={true}
                    color={'#ee735c'}
                    progress={this.state.avatarProgress}
                    />
                : <Icon 
                    name='ios-cloud-upload-outline'
                    style={styles.uploadIcon} 
                  />
              }
              </View>
            </TouchableOpacity>
        }

        <Modal
          animationType={'fade'}
          visible={this.state.modalvisible}
          >
          <View style={styles.modalContainer}>
            <Icon
              name='ios-close-outline'
              onPress={this._closeModal}
              style={styles.closeIcon} />
            <View style={styles.fieldItem}>
              <Text style={styles.label}>昵称</Text>
              <TextInput
                placeholder={'输入你的昵称'}
                style={styles.inputField}
                autoCapitalize={'none'}
                autoCorrect={false}
                defaultValue={user.nickname}
                onChangeText={(text) => {
                  this._changeUserState('nickname', text)
                }} />
            </View>

            <View style={styles.fieldItem}>
              <Text style={styles.label}>品种</Text>
              <TextInput
                placeholder={'输入品种'}
                style={styles.inputField}
                autoCapitalize={'none'}
                autoCorrect={false}
                defaultValue={user.breed}
                onChangeText={(text) => {
                  this._changeUserState('breed', text)
                }} />
            </View>

           <View style={styles.fieldItem}>
              <Text style={styles.label}>年龄</Text>
              <TextInput
                placeholder={'输入年龄'}
                style={styles.inputField}
                autoCapitalize={'none'}
                autoCorrect={false}
                defaultValue={user.age}
                onChangeText={(text) => {
                  this._changeUserState('age', text)
                }} />
            </View>

            <View style={styles.fieldItem}>
              <Text style={styles.label}>性别</Text>
              <Icon.Button
                onPress={() => {
                  this._changeUserState('gender', 'male')
                }}
                style={[
                  styles.gender,
                  user.gender === 'male' && styles.genderChecked
                  ]} 
                name='ios-body'>男</Icon.Button>

                <Icon.Button
                  onPress={() => {
                    this._changeUserState('gender', 'female')
                  }}
                  style={[
                  styles.gender,
                  user.gender === 'female' && styles.genderChecked
                  ]} 
                name='ios-body-outline'>女</Icon.Button>
            </View>

            <Button style={styles.btn} onPress={this._save}>保存</Button>

          </View>
        </Modal>
        <Button style={styles.btn} onPress={this._logout}>注销</Button>
      </View>
    )
  }

  _logout = () => {
    this.props.logout()
  }

  _save = () => {
   this._asyncUser()
  }

  _changeUserState(key,value) {
    var user = this.state.user
    user[key] = value
    this.setState({
      user: user
    })
  }

  _setModalVisible = (visiable) => {
    this.setState({
      modalvisible: visiable
    })
  }

  _closeModal = () => {
    this._setModalVisible(false)
  }

  _showModal = () => {
    this._setModalVisible(true)
  }

  _getQiniuToken = () => {
    var accessToken = this.state.user.accessToken
    var signatureURL = config.api.base + config.api.signature
    return request.post(signatureURL, {
        accessToken: accessToken,
        cloud: 'qiniu'
      })
      .catch((error) => {
        console.log('error ' + error)
      })
  }

  _showPicker = () => {
    ImagePicker.showImagePicker(photoOptions, (response) => {
      // You can display the image using either data...
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return
      }

      if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        return
      }

      var uri = response.uri
      this._getQiniuToken()
      .then((data) => {
        if (data && data.success) {
          var token = data.data.token
          var key = data.data.key

          var body = new FormData()
          body.append('token', token)
          body.append('key', key)
          body.append('file', {
            type: 'image/png',
            uri: uri,
            name: key
          })

          this._upload(body)
        }
      })
    })
  }

  _upload = (body) => {
    this.setState({
      avatarProgress: 0,
      avatarUploading: true
    })
    var url = config.qiniu.upload

    var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = (e) => {
        if (xhr.readyState !== 4) {
          return;
        }
        if (xhr.status !== 200) {
          AlertIOS.alert('请求失败'+xhr.responseText)
          return
        }
        if (!xhr.responseText) {
          AlertIOS.alert('请求失败')
          return
        }


        if (xhr.status === 200) {
          console.log('success', xhr.responseText);
        }

        var response

        try {
          response = JSON.parse(xhr.response)
        }
        catch(e) {
          console.log(e)
          console.log('parse fail')
        }

        console.log(response)

        if (response){
          var user = this.state.user
          if (response.public_id) {
            user.avatar = response.public_id
          } 
          if (response.key) {
            user.avatar = response.key 
          }
          this.setState({
            user: user,
            avatarProgress: 0,
            avatarUploading: false
          })

          this._asyncUser(true)
        }

      }

    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          var percent = Number((event.loaded / event.total).toFixed(2))
          this.setState({
            avatarProgress: percent
          })
        }
      }
    }

    xhr.open('POST', url)
    xhr.send(body)
  }

  _asyncUser(isAvatar) {
    var user = this.state.user

    if (user && user.accessToken) {
      var url = config.api.base + config.api.update
      request.post(url,user)
      .then((data) => {
        if (data && data.success) {
          var userTmp = data.data
          if (isAvatar) {
            AlertIOS.alert('更新头像成功')
          }
          this.setState({
            user: userTmp
          }, function () {
            AsyncStorage.setItem('user',JSON.stringify(userTmp))
            this._closeModal()
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },

  navigationBar: {
    paddingTop: 25,
    paddingBottom: 12,
    flexDirection: 'row',
    backgroundColor: '#ee735c'
  },

  naviTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  avatarContainer: {
    width: width,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ddd'
  },

  avatarBox: {
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },

  uploadIcon: {
    padding: 20,
    paddingLeft: 25,
    paddingRight: 25,
    color: '#999',
    fontSize: 24,
    backgroundColor: '#fff',
    borderRadius: 8
  },

  avatarTip: {
    color: '#fff',
    backgroundColor: 'transparent',
    fontSize: 14
  },

  avatar: {
    marginBottom: 15,
    width: width * 0.2,
    height: width * 0.2,
    resizeMode: 'cover',
    borderRadius: width * 0.1,
  },

  editText: {
    position: 'absolute',
    top: 25,
    right: 10,
    color: '#fff',
    fontSize: 14,
  },

  closeIcon: {
    position: 'absolute',
    top: 20,
    right: 10,
    width: 40,
    height: 40,
    color: '#ee735c',
    fontSize: 32
  },

  modalContainer: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#fff'
  },

  fieldItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    paddingLeft: 15,
    paddingRight: 15,
    borderColor: '#eee',
    borderBottomWidth: 1,
  },

  label: {
    color: '#ccc',
    marginRight: 10
  },

  inputField: {
    height: 50,
    flex: 1,
    color: '#666',
    fontSize: 15
  },

  gender: {
    backgroundColor: '#ccc'
  },

  genderChecked: {
    backgroundColor: '#ee735c'
  },

    btn: {
    marginTop: 25,
    padding: 10,
    marginRight: 10,
    marginLeft: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 4,
    borderColor: '#ee735c',
    color: '#ee735c'
  },

});