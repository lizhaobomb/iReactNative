import React, { Component } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import Video from 'react-native-video'
import ImagePicker from 'react-native-image-picker'
import CountDownText from  '../third/countdown/CountDownText'
import {AudioRecorder, AudioUtils} from 'react-native-audio'
import Sound from 'react-native-sound' 
import Button from 'react-native-button'
import _ from 'lodash'

import * as Progress from 'react-native-progress'

import config from '../common/config'
import request from '../common/request'


import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  ProgressViewIOS,
  AsyncStorage,
  AlertIOS,
  Modal,
  TextInput
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

var defaultState = {
  previewVideo: null,

  title: '',
  modalvisible: false,
  publishProgress: 0.24,
  publishing: false,
  willPublish: false,

  //video upload
  video: null,
  videoId: null,
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

  //audio
  audio: null,
  audioId: null,
  audioPlaying: false,
  recordDone: false,
  audioUploadedProgress: 0.14,
  audioUploaded: false,
  audioUploading: false,
  audioPath: AudioUtils.DocumentDirectoryPath + '/baobao.aac',

  //video player
  rate: 1,
  muted: true,
  resizeMode: 'contain',
  repeat: false
}


export default class Edit extends Component {

  constructor(props) {
    super(props)
    var user = this.props.user || {}
    var state = _.clone(defaultState)
    state.user = user 
    this.state = state

    Sound.setCategory('Ambient', true)
  }

  _initSound = () => {
    var audioPath = this.state.audioPath
    var whoosh = new Sound(audioPath, null, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      } 
    // loaded successfully
    console.log('duration in seconds: ' + whoosh.getDuration() + 'number of channels: ' + whoosh.getNumberOfChannels());
    })
    whoosh.play((success) => {
      if (success) {
        console.log('successfully finished playing');
      } else {
        console.log('playback failed due to audio decoding errors');
      }
    })
  }

  _initAudio = () => {
    var audioPath = this.state.audioPath

    AudioRecorder.prepareRecordingAtPath(audioPath, {
      SampleRate: 22050,
      Channels: 1,
      AudioQuality: "High",
      AudioEncoding: "aac"
    })
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
    this._initAudio()
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
                      this.state.recording || this.state.audioPlaying
                      ? <View style={styles.progressTipBox}>
                          <ProgressViewIOS style={styles.progressBar}
                            progressTintColor='#ee735c'
                            progress={this.state.videoProgress} />
                            
                            {
                              this.state.recording 
                              ? <Text style={styles.progressTip}>
                                  录制声音中
                                </Text>
                              : null
                            }

                        </View>
                      : null
                    }

                    {
                      this.state.recordDone
                      ? <View style={styles.previewBox}>
                          <Icon name='ios-play' style={styles.previewIcon} />
                          <Text style={styles.previewText} onPress={this._preview}>预览</Text>
                        </View>
                      :null
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

          {
            this.state.videoUploaded && this.state.recordDone
            ? <View style={styles.audioUploadBox}>
              {
                !this.state.audioUploaded && !this.state.audioUploading 
                ? <Text style={styles.audioUploadText} onPress={this._uploadAudio}>下一步</Text>
                : null
              }

              {
                this.state.audioUploading 
                ? <Progress.Circle 
                    size={60} 
                    showsText={true}
                    color={'#ee735c'}
                    progress={this.state.audioUploadedProgress}
                  />
                : null
              }

             </View>
            : null
          }

          <View>
          </View>
        </View>
        <Modal
          animationType={'fade'}
          visible={this.state.modalvisible}
          >
          <View style={styles.modalContainer}>
            <Icon
              name='ios-close-outline'
              onPress={this._closeModal}
              style={styles.closeIcon} />

            {
              this.state.audioUploaded && !this.state.publishing
              ? <View style={styles.fieldBox}>
                  <TextInput
                    placeholder={'给宝宝一句宣言吧'}
                    style={styles.inputField}
                    autoCapitalize={'none'}
                    autoCorrect={false}
                    defaultValue={this.state.title}
                    onChangeText={(text) => {
                      this.setState({
                        title: text
                      })
                    }} />
                </View>
              : null
            }

            {
              this.state.publishing
              ? <View style={styles.loadingBox}>
                  <Text style={styles.loadingText}>
                    耐心等一下，拼命为您生成专属视频中...</Text>
                  {
                    this.state.willPublish
                    ? <Text style={styles.loadingText}>
                      正在合成音频视频...</Text>
                    : null
                  }

                  {
                    this.state.publishProgress > 0.4
                    ? <Text style={styles.loadingText}>
                      开始上传咯！...</Text>
                    : null
                  }

                  <Progress.Circle 
                    size={60} 
                    showsText={true}
                    color={'#ee735c'}
                    progress={this.state.publishProgress}
                    />
                </View>
              : null
            }

            {
              this.state.audioUploaded && !this.state.publishing
              ? <Button style={styles.btn} onPress={this._save}>保存</Button>
              : null
            }

          </View>
        </Modal>
      </View>
  )}

  _save = () => {
    var body = {
      title: this.state.title,
      videoId: this.state.videoId,
      audioId: this.state.audioId,
    }

    var creationURL = config.api.base + config.api.creations
    var user  = this.state.user
    if (user && user.accessToken) {
      body.accessToken = user.accessToken

      this.setState({
        publishing: true
      })

      request
      .post(creationURL,body)
      .catch((error) => {
        console.log(error)
        this.setState({
            publishing: false
          })
      })
      .then((data) => {
        if (data && data.success) {
          this._closeModal()
          console.log('视频发布成功')
          var state = _.clone(defaultState)
          this.setState(state)
        }
        else {
          this.setState({
            publishing: false
          })
          AlertIOS.alert('视频发布失败')
        }
      })
    }
  }

  _closeModal = () => {
    this.setState({
      modalvisible: false
    })
  }

   _showModal = () => {
    this.setState({
      modalvisible: true
    })
  }

  _getToken = (body) => {
    var signatureURL = config.api.base + config.api.signature

    body.accessToken = this.state.user.accessToken

    return request.post(signatureURL, body)
  }

  _uploadAudio = () => {
    var tags = 'app,audio'
    var folder = 'audio'
    var timestamp = Date.now()
    this._getToken({
      type: 'audio',
      cloud: 'cloudinary',
      timestamp: timestamp
    })
    .catch((error) => {
      console.log(error)
    })
    .then((data) => {
      if (data && data.success) {
        var signature = data.data.token
        var key = data.data.key
        var body = new FormData()

        body.append('folder', folder)
        body.append('signature', signature)
        body.append('tags', tags)
        body.append('timestamp', timestamp)
        body.append('api_key', config.cloudinary.api_key)
        body.append('resource_type', 'video')
        body.append('file', {
          type: 'video/mp4',
          uri: this.state.audioPath,
          name: key
        })

        this._upload(body, 'audio')
      }
    })
  }

   _upload = (body, type) => {
    var url = config.qiniu.upload
    var xhr = new XMLHttpRequest()
    if (type === 'audio') {
      url = config.cloudinary.video
    }
    var newState = {}
    newState[type + 'Uploading'] = true
    newState[type + 'Uploaded'] = false
    newState[type + 'UploadedProgress'] = 0
    this.setState(newState)

    xhr.onreadystatechange = (e) => {

      if (xhr.readyState !== 4) {
        return;
      }
      if (xhr.status !== 200) {
        console.log(xhr)
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
        var newState = {}
        newState[type] = response
        newState[type + 'Uploading'] = false
        newState[type + 'Uploaded'] = true

        this.setState(newState)

        var updateURL = config.api.base + config.api[type]
        var accessToken = this.state.user.accessToken
        var updateBody = {
          accessToken: accessToken
        }
        updateBody[type] = response

        if (type === 'audio') {
          updateBody.videoId = this.state.videoId
        }

        request
        .post(updateURL, updateBody)
        .catch((error) => {
          console.log(error)
          if (type === 'video') {
            AlertIOS.alert('视频同步出错，请重新上传！')
          }
          else if(type === 'audio'){
            AlertIOS.alert('音频同步出错，请重新上传！')
          }
        })
        .then((data) => {
          if (data && data.success) {
            var mediaState = {}
            mediaState[type + 'Id'] = data.data
            if (type === 'audio') {
              this._showModal()
              mediaState.willPublish = true
            }
            this.setState(mediaState)

           }
           else {
             if (type === 'video') {
                AlertIOS.alert('视频同步出错，请重新上传！')
              }
              else if(type === 'audio'){
                AlertIOS.alert('音频同步出错，请重新上传！')
              }
           }
        })
      }
    }

    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          var percent = Number((event.loaded / event.total).toFixed(2))
          var progressState = {}
          progressState[type + 'UploadedProgress'] = percent
          progressState.publishProgress = percent
          this.setState(progressState)
        }
      }
    }
    console.log(body)
    xhr.open('POST', url)
    xhr.setRequestHeader('Content-Type', 'multipart/form-data')
    xhr.send(body)
}

  _pickVideo = () => {
    ImagePicker.showImagePicker(videoOptions, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return
      }

      if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        return
      }

      var uri = response.uri
      var state = _.clone(defaultState)
      state.user = this.state.user
      state.previewVideo = uri

      this.setState(state)

      this._getToken({
         cloud: 'qiniu',
          type: 'video'
      })
      .catch((error) => {
        AlertIOS.alert(error)
      })
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

          this._upload(body, 'video')
        }
      })
    })
  }

  _onLoadStart = () => {
    console.log('_onLoadStart')
  }

  _onLoad = (data) => {
    console.log('_onLoad')
    console.log(data)
    this.setState({
      videoTotal: data.duration
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
      })
    if (this.state.recording) {
      this.setState({
        recordDone: true,
        recording: false
      })
      AudioRecorder.stopRecording()
    }
  }

  _onError = (e) => {
    console.log('_onError')
    console.log(e)
  }

  _preview = () => {
    if (this.state.audioPlaying) {
      AudioRecorder.stopRecording()
    }
    this.setState({
      videoProgress: 0,
      audioPlaying: true
    })
    this._initSound()
    this.player.seek(0)
  }

  _record = () => {
    console.log('_record')
    this.setState({
      videoProgress: 0,
      recording: true,
      counting: false
    })
    AudioRecorder.startRecording()
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
    width: width,
    height: 1
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
  },

  previewBox: {
    width: 80,
    height: 30,
    position: 'absolute',
    right: 10,
    bottom: 10,
    borderRadius: 3,
    borderColor: '#ee735c',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },

  previewIcon: {
    color: '#ee735c',
    marginRight: 5,
    fontSize: 20,
    backgroundColor: 'transparent'
  },

  previewText: {
    color: '#ee735c',
    fontSize: 20,
    backgroundColor: 'transparent'
  },

  audioUploadBox: {
    width: width,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },

  audioUploadText: {
    width: width - 20,
    padding: 5,
    borderWidth: 1,
    borderColor: '#ee735c',
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 30,
    color: '#ee735c'
  },

  closeIcon: {
    position: 'absolute',
    top: 30,
    right: 20,
    color: '#ee735c',
    fontSize: 32
  },

  loadingBox: {
    width: width,
    marginTop: 10,
    padding: 15,
    alignItems: 'center'
  },

  loadingText: {
    marginBottom: 10,
    color: '#333',
    textAlign: 'center'
  },

  fieldBox: {
    width: width - 40,
    height: 36,
    marginTop: 30,
    marginLeft: 20,
    marginRight: 20,
    borderBottomColor: '#eaeaea',
    borderBottomWidth: 1
  },

  modalContainer: {
    width:width,
    height:height,
    paddingTop: 50,
    backgroundColor: '#fff'
  },

  inputField: {
    height: 36,
    flex: 1,
    color: '#666',
    fontSize: 15,
    textAlign: 'center'
  },

  btn: {
    marginTop: 15,
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