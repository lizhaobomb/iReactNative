//noinspection JSUnresolvedVariable
import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';

import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ActivityIndicator
} from 'react-native';

var width = Dimensions.get('window').width

export default class Detail extends Component {

  constructor(props) {
    super(props);
    this.state = {
      videoProgress: 0.01,
      currentTime: 0,
      videoLoaded: false,
      playing:false,
      onEnd:false,
    }
  }

  render() {
    var data = this.props.data
    return (
      <View style={styles.container}>
        <Text onPress={() => this._back()}>详情页面</Text>
        <View style={styles.videoBox}>
          <Video
          ref={(ref) => {
            this.player = ref
            }}
            source={{uri:data.video}}
            rate={1.0}
            muted={false}
            paused={false}
            resizeMode='contain'
            repeat={false}
            onLoadStart={this._onLoadStart}
            onLoad={this._onLoad}
            onProgress={this._onProgress}
            onEnd={this._onEnd}
            onError={this._onError}
            style={styles.video} />
            {
              this.state.videoLoaded && !this.state.playing
              ? <Icon
                  onPress={this._replay}
                  name='ios-play'
                  size={50}
                  style={styles.play} />
              : null
            }
            <View style={styles.progressBox}>
              <View style={[styles.progressBar, {width:width * this.state.videoProgress}]}>
                
              </View>
            </View>

        </View>
      </View>
      )
  }

  _replay = () => {
    this.setState({
      onEnd:false
    })
    this.player.seek(0)
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
    console.log('_onProgress')
    var duration = data.playableDuration
    var currentTime = data.currentTime
    var percent = Number((currentTime / duration).toFixed(2))
    var newState = {
      currentTime: Number(currentTime.toFixed(2)),
      videoProgress: percent
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
      videoProgress:1,
      playing:false,
      onEnd:true,
    })
    console.log(this.state)
  }

  _onError(e){
    console.log(e)
    console.log('_onError')
  }

  _back() {
    this.props.navigator.pop()
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },

  videoBox: {
    width: width,
    height: 360,
    backgroundColor:'#000'
  },

  video: {
    width:width,
    height:360,
    backgroundColor:'#000'
  },

  progressBox: {
    width:width,
    height:2,
    backgroundColor:'#ccc'
  },

  progressBar: {
    width:1,
    height:2,
    backgroundColor:'#ff6600'
  },

  play: {
    position: 'absolute',
    top:140,
    left:width / 2 - 30,
    width: 60,
    height: 60,
    paddingTop: 5,
    paddingLeft: 20,
    backgroundColor: 'transparent',
    borderColor: '#ed7b66',
    borderWidth: 1,
    borderRadius: 30,
    color: '#ed7b66'
  }


});