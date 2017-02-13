import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-picker'
import * as Progress from 'react-native-progress';
import sha1 from 'sha1'
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
  AlertIOS
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

var CLOUDINARY = {
  cloud_name: 'lizhao',  
  api_key: '134811467767913',  
  api_secret: 'h82sYoQNuXheDKv6J0y8ws2lCV4',  
  base: 'https://api.cloudinary.com/v1_1/lizhao',
  resBase: 'http://res.cloudinary.com/lizhao',
  image: 'https://api.cloudinary.com/v1_1/lizhao/image/upload',
  video: 'https://api.cloudinary.com/v1_1/lizhao/video/upload',
  audio: 'https://api.cloudinary.com/v1_1/lizhao/raw/upload',

}

function avatar(id, type) {
  return CLOUDINARY.resBase + '/' + type + '/upload/' + id
}

export default class Account extends Component {

  constructor(props) {
    super(props);
    var user = this.props.user || {}
    this.state = {
      user: user,
      avatarProgress: 0,
      avatarUploading: false
    };
  }

  componentDidMount() {
    AsyncStorage.getItem('user')
    .then((data) => {
      var user
      if (data) {
        user = JSON.parse(data)
      }
      user.avatar = ''
      if (user && user.accessToken) {
        this.setState({
          user: user
        })
      }
    })
  }

  render() {
    var user = this.state.user
    console.log(this._showPicker)
    return (
      <View style={styles.container}>
        <View style={styles.navigationBar}>
          <Text style={styles.naviTitle}>我的账户</Text>
        </View>
        {
          user.avatar 
          ? <TouchableOpacity style={styles.avatarContainer} onPress={this._showPicker}>
              <Image source={{uri:user.avatar}} style={styles.avatarContainer}>
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
                        source={{uri:user.avatar}} 
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

      </View>
      )
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

      var source = {uri: 'data:image/jpeg;base64,' + response.data, isStatic: true};

      var timestamp = Date.now()
      var tags = 'app,avatar'
      var folder = 'avatar'
      var signatureURL = config.api.base + config.api.signature
      var accessToken = this.state.user.accessToken
      request.post(signatureURL, {
        accessToken: accessToken,
        timestamp: timestamp,
        type: 'avatar'
      })
      .then((data) => {
        console.log(data)
        if (data && data.success) {
          var signature = 'folder=' + folder + '&tags=' + tags + 
                          '&timestamp=' + timestamp + CLOUDINARY.api_secret

          signature = sha1(signature)

          var body = new FormData()
          body.append('folder', folder)
          body.append('signature', signature)
          body.append('tags', tags)
          body.append('api_key', CLOUDINARY.api_key)
          body.append('source_type', 'image')
          body.append('file', source.uri)
          body.append('timestamp', timestamp)


          this._upload(body)
        }
      })
      .catch((error) => {
        console.log('error ' + error)
      })
    })
  }

  _upload = (body) => {
    this.setState({
      avatarProgress: 0,
      avatarUploading: true
    })
    var url = CLOUDINARY.image

    console.log(body)

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

        if (response && response.public_id) {
          console.log('response>>>>>>'+response)
          var user = this.state.user
          user.avatar = avatar(response.public_id, 'image')
          console.log(user.avatar)
          this.setState({
            user: user,
            avatarProgress: 0,
            avatarUploading: false
          })
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
  }
});