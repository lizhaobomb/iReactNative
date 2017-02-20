import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import ImagePicker from 'react-native-image-picker';

import config from '../common/config';
import request from '../common/request';


import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  ProgressViewIOS,
  AsyncStorage,
  AlertIOS
} from 'react-native';

var width = Dimensions.get('window').width
var height = Dimensions.get('window').height


var videoOptions = {
  title: '选择视频',
  cancelButtonTitle: '取消',
  takePhotoButtonTitle: '录制 10 秒视频',
  chooseFromLibraryButtonTitle: '选择已有视频',
  videoQuality: 'medium',
  mediaType: 'video',
  durationLimit: 10,
  noData: false,
  
  storageOptions: {
    skipBackup: true,
    path: 'images'
  }
}


export default class Edit extends Component {

  constructor(props) {
    super(props)
  
    this.state = {
      previewVideo: null,
      videoUploadedProgress: 0.01,
      currentTime: 0,
      videoUploaded: false,
      videoUploading: false,
      playing:false,
      onEnd:false,
      paused:false,
      videoOk:true,

      video: null,

      //video player
      rate: 1,
      muted: false,
      resizeMode: 'contain',
      repeat: false
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
    return (
      <View style={styles.container}>
        <View style={styles.navigationBar}>
          <Text style={styles.naviTitle}>{this.state.previewVideo ? '点击按钮配音' : '理解宝宝，从配音开始'}</Text>
          <Text style={styles.editText} onPress={this._pickVideo}>更换视频</Text>
        </View>

        <View style={styles.page}>
          {
            this.state.previewVideo 
            ? <View style={styles.videoContainer}>
                <View style={styles.videoBox}>
                  <Video
                    ref={(ref) => {
                      this.player = ref
                      }}
                    source={{uri:this.state.previewVideo}}
                    rate={this.state.rate}
                    muted={this.state.muted}
                    paused={this.state.paused}
                    resizeMode={this.state.resizeMode}
                    repeat={this.state.repeat}
                    onLoadStart={this._onLoadStart}
                    onLoad={this._onLoad}
                    onProgress={this._onProgress}
                    onEnd={this._onEnd}
                    onError={this._onError}
                    style={styles.video} />
                    {
                      !this.state.videoUploaded && this.state.videoUploading
                      ? <View style={styles.progressTipBox}>
                          <ProgressViewIOS style={styles.progressBar}
                            progressTintColor='#ee735c'
                            progress={this.state.videoUploadedProgress} />
                          <Text style={styles.progressTip}>正在生成静音视频，已完成
                            {(this.state.videoUploadedProgress * 100).toFixed(2)}%
                          </Text>
                        </View>
                      : null
                    }
                </View>
              </View>
            : <TouchableOpacity style={styles.uploadContainer}
              onPress={this._pickVideo}>
                <View style={styles.uploadBox}>
                  <Image source={require('../assets/images/record.png')}
                    style={styles.uploadIcon} />
                  <Text style={styles.uploadTitle}>点我上传视频</Text>
                  <Text style={styles.uploadDesc}>建议时长不超过20秒</Text>
                </View>
              </TouchableOpacity>
          }
        </View>
      </View>
      )
  }

  _getQiniuToken = () => {
    var accessToken = this.state.user.accessToken
    var signatureURL = config.api.base + config.api.signature
    return request.post(signatureURL, {
        accessToken: accessToken,
        cloud: 'qiniu',
        type: 'video'
      })
      .catch((error) => {
        console.log('error ' + error)
      })
  }

   _upload = (body) => {
    this.setState({
      videoUploading: true,
      videoUploaded: false,
    })

    var url = config.qiniu.upload
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = (e) => {
      console.log(xhr.status)

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
        this.setState({
          video: response,
          videoLoaded: true,
          videoUploading: false
        })
      }
    }

    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          var percent = Number((event.loaded / event.total).toFixed(2))
          this.setState({
            videoUploadedProgress: percent
          })
        }
      }
    }

    xhr.open('POST', url)
    xhr.send(body)
  }

  _pickVideo = () => {
    ImagePicker.showImagePicker(videoOptions, (response) => {
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
      this.setState({
        previewVideo: uri
      })

      this._getQiniuToken()
      .then((data) => {
        if (data && data.success) {
          var token = data.data.token
          var key = data.data.key

          var body = new FormData()
          body.append('token', token)
          body.append('key', key)
          body.append('file', {
            type: 'video/mp4 ',
            uri: uri,
            name: key
          })

          this._upload(body)
        }
      })
    })
  }

   _onLoadStart() {
    console.log('_onLoadStart')
  }

  _onLoad = (data) => {
    console.log('_onLoad')

  }

  _onProgress = (data) => {
    if(this.state.onEnd){
      return;
    }
    // console.log('_onProgress')
    // console.log(data)

    var duration = data.playableDuration
    var currentTime = data.currentTime
    var percent = Number((currentTime / duration).toFixed(2))
    var newState = {
      currentTime: Number(currentTime.toFixed(2)),
      videoUploadedProgress: percent
    }
    if (!this.state.videoLoaded) {
      newState.videoLoaded = true
    }

    if (!this.state.playing) {
      newState.playing = true
    }

    this.setState(newState)
  }

  _onEnd = () => {
    console.log('_onEnd')
    this.setState({
      videoUploadedProgress:1,
      playing:false,
      onEnd:true,
    })
  }

  _onError = (e) => {
    this.setState({
      videoOk:false
    })
    console.log(e)
    console.log('_onError')
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

  editText: {
    position: 'absolute',
    top: 25,
    right: 10,
    color: '#fff',
    fontSize: 14,
  },

  page: {
    flex: 1,
    alignItems: 'center'
  },

  uploadContainer: {
    marginTop: 90,
    width: width - 20,
    paddingBottom: 10,
    borderWidth: 1,
    borderRadius: 6,
    borderColor: '#ee735c',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },

  uploadTitle: {
    textAlign: 'center',
    fontSize: 16,
    paddingTop: 10,
    marginBottom: 10,
    color: '#000'
  },

  uploadDesc: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
  },

  uploadBox: {
    justifyContent: 'center',
    alignItems: 'center'
  },

  uploadIcon: {
    width: 110,
    height: 110,
    resizeMode: 'contain'
  },

  videoContainer: {
    width: width,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },

  videoBox: {
    width: width,
    height: height * 0.66,
    backgroundColor: '#333'
  },

  video: {
  flex: 1,
  backgroundColor:'#000'
  },

  progressTipBox: {
    width: width,
    height: 30,
    backgroundColor: 'rgba(244,244,244,0.65)'
  },

  progressTip: {
    color: '#333',
    width: width - 10,
    padding: 5,
  },

  progressBar: {
    width: width
  }


});