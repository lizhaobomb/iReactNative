import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import ImagePicker from 'react-native-image-picker';
import CountDownText from  '../third/countdown/CountDownText'

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
    var user = this.props.user || {}
    this.state = {
      user: user,
      previewVideo: null,

      //video upload
      video: null,
      videoUploadedProgress: 0.01,
      videoUploaded: false,
      videoUploading: false,

      currentTime: 0,
      onEnd: false,
      videoTotal: 0,
      videoProgress: 0,

      //count down
      counting: false,
      recording: false,

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
          {
            this.state.previewVideo && this.state.videoUploaded
            ? <Text style={styles.editText} onPress={this._pickVideo}>更换视频</Text>
            : null
          }
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

                    {
                      this.state.recording
                      ? <View style={styles.progressTipBox}>
                          <ProgressViewIOS style={styles.progressBar}
                            progressTintColor='#ee735c'
                            progress={this.state.videoProgress} />
                          <Text style={styles.progressTip}>
                            录制声音中
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

          {
            this.state.videoUploaded
            ? <View style={styles.recordBox}>
                <View style={[styles.recordIconBox, this.state.recording && styles.recordOn]}>
                  {
                    this.state.counting && !this.state.recording
                    ? <CountDownText
                        style={styles.countBtn}
                        countType='seconds' // 计时类型：seconds / date
                        auto={true} // 自动开始
                        afterEnd={this._record} // 结束回调
                        timeLeft={5} // 正向计时 时间起点为0秒
                        step={-1} // 计时步长，以秒为单位，正数则为正计时，负数为倒计时
                        startText='准备录制' // 开始的文本
                        endText='Go' // 结束的文本
                        intervalText={(sec) => {
                          return sec === 0 ? 'Go' : sec
                          }
                        } // 定时的文本回调
                      />
                    : <TouchableOpacity onPress={this._counting}>
                        <Icon name='ios-mic' style={styles.recordIcon} />
                      </TouchableOpacity>
                  }
                </View>
              </View>
            : null
          }

        </View>
      </View>
  )}

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
      console.log(xhr)

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
          videoUploaded: true,
          videoUploading: false
        })

        var videoURL = config.api.base + config.api.video
        var accessToken = this.state.user.accessToken
        request.post(videoURL, {
          accessToken: accessToken,
          video: response
        })
        .catch((error) => {
          console.log(error);
          AlertIOS.alert('视频同步出错，请重新上传！')
        })
        .then((data) => {
          if (!data || !data.success) {
            AlertIOS.alert('视频同步出错，请重新上传！')
          }
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

   _onLoadStart = () => {
    console.log('_onLoadStart')
  }

  _onLoad = (data) => {
    console.log('_onLoad')
    this.setState({
      videoTotal: data.playableDuration
    })
  }

  _onProgress = (data) => {
    if(this.state.onEnd){
      return;
    }
    console.log('_onProgress')
    // console.log(data)

    var duration = data.playableDuration
    var currentTime = data.currentTime
    var percent = Number((currentTime / duration).toFixed(2))

    this.setState({
      currentTime: Number(currentTime.toFixed(2)),
      videoProgress: percent
    })
  }

  _onEnd = () => {
    console.log('_onEnd')
      this.setState({
        videoProgress:1,
        onEnd:true,
        recording: false
      })
  }

  _onError = (e) => {
    console.log('_onError')
    console.log(e)
  }

  _record = () => {
    console.log('_record')
    this.setState({
      videoProgress: 0,
      recording: true,
      counting: false
    })

    this.player.seek(0)
  }

  _counting = () => {
    console.log('_counting')
    if (!this.state.counting && !this.state.recording) {  
      this.setState({
        counting: true
      })
      this.player.seek(this.state.videoTotal - 0.01)
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
  },

  recordBox: {
    width: width,
    height: 60,
    alignItems: 'center'
  },

  recordIconBox: {
    width: 68,
    height: 68,
    marginTop: -30,
    borderRadius: 34,
    backgroundColor: '#ee735c',
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },

  recordIcon: {
    fontSize: 58,
    backgroundColor: 'transparent',
    color: '#fff'
  },

  recordOn: {
    backgroundColor: '#ccc'
  },

  countBtn: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff'
  }


});