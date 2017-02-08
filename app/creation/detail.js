//noinspection JSUnresolvedVariable
import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import request from '../common/request';
import config from '../common/config';

import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Image,
  ListView,
} from 'react-native';

var width = Dimensions.get('window').width

export default class Detail extends Component {

  constructor(props) {
    super(props);

    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

    this.state = {
      videoProgress: 0.01,
      currentTime: 0,
      videoLoaded: false,
      playing:false,
      onEnd:false,
      paused:false,
      videoOk:true,

      dataSource: ds.cloneWithRows([]),
    }
  }

  render() {
    var data = this.props.data
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={this._back} style={styles.popBox}>
            <Icon name='ios-arrow-back' style={styles.backIcon} />
            <Text style={styles.backText}>返回</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>视频详情页面</Text>
        </View>
        <View style={styles.videoBox}>
          <Video
          ref={(ref) => {
            this.player = ref
            }}
            source={{uri:data.video}}
            rate={1.0}
            muted={false}
            paused={this.state.paused}
            resizeMode='contain'
            repeat={false}
            onLoadStart={this._onLoadStart}
            onLoad={this._onLoad}
            onProgress={this._onProgress}
            onEnd={this._onEnd}
            onError={this._onError}
            style={styles.video} />

            {
              !this.state.videoOk && <Text style={styles.failText}>视频出错了</Text>
            }

            {
              this.state.videoLoaded && !this.state.playing
              ? <Icon
                  onPress={this._replay}
                  name='ios-play'
                  size={50}
                  style={styles.play} />
              : null
            }

            {
              this.state.videoLoaded && this.state.playing 
              ? <TouchableOpacity onPress={this._paused} style={styles.pauseButton}>
                  {
                    this.state.paused ? <Icon onPress={this._resume} 
                                          name='ios-play' 
                                          size={50}
                                          style={styles.resumeIcon} />
                                      : <Text></Text>
                  }
                </TouchableOpacity>
              :null
            }

            <View style={styles.progressBox}>
              <View style={[styles.progressBar, {width:width * this.state.videoProgress}]}>
              </View>
            </View>
        </View>
        <ScrollView 
        enableEmptySections={true}
        automaticallyAdjustContentInsets={false}>
          <View style={styles.infoBox}>
            <Image style={styles.avatar} source={{uri:data.author.avatar}}>
            </Image>
            <View style={styles.contentBox}>
              <Text style={styles.nickname}>{data.author.nickname}</Text>
              <Text style={styles.title}>{data.title}</Text>
            </View>
          </View>
          <ListView
            dataSource={this.state.dataSource}
            renderRow={this._renderRow}
            enableEmptySections={true}
            automaticallyAdjustContentInsets={false}
          />
        </ScrollView>
      </View>
      )
  }

  componentDidMount() {
    this._fetchData()
  }

  _renderRow = (row) => {
    return (
      <View key={row._id} style={styles.replyBox}>
        <Image style={styles.replyAvatar} source={{uri:row.replyBy.avatar}} />
        <View style={styles.reply}>
          <Text style={styles.replyNickName}>{row.replyBy.nickname}</Text>
          <Text style={styles.replyContent}>{row.content}</Text>
        </View>
      </View>
      )
  }

  _fetchData = () => {
    var url = config.api.base + config.api.comments
    request.get(url, 
      {
        'creations':'124',
        'accessToken':'332423'
      })
    .then((data) => {
      console.log(data)
      if (data && data.success) {
        var comments = data.data
        if (comments && comments.length > 0) {
          this.setState({
            comments : comments,
            dataSource : this.state.dataSource.cloneWithRows(comments)
          })
        }
      }
    })
    .catch((e) => {
      console.log(e)
    })
  }

  _paused = () => {
    console.log('paused')
    if (!this.state.paused) {
      this.setState({
        paused:true
      })
    }
  }

  _resume = () => {
    if (this.state.paused) {
      this.setState({
        paused:false
      })
    }
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

  _onError = (e) => {
    this.setState({
      videoOk:false
    })
    console.log(e)
    console.log('_onError')
  }

  _back = () => {
    this.props.navigator.pop()
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },

  header: {
    flexDirection:'row',
    justifyContent: 'center',
    alignItems:'center',
    width:width,
    height:64,
    paddingTop:20,
    paddingLeft:10,
    paddingRight:10,
    borderBottomWidth:1,
    borderColor:'rgba(0,0,0,0.1)',
    backgroundColor:'#fff'
  },

  popBox: {
    position:'absolute',
    left:12,
    top:32,
    width:50,
    flexDirection:'row',
    alignItems:'center',
  },

  headerTitle: {
    width:width - 120,
    textAlign:'center'
  },

  backIcon: {
    color:'#999',
    fontSize:20,
    marginRight:5
  },

  backText: {
    color:'#999'
  },

  videoBox: {
    width: width,
    height: width * 0.66,
    backgroundColor:'#000'
  },

  infoBox: {
    width:width,
    flexDirection:'row',
    justifyContent:'center',
    marginTop:10
  },

  avatar: {
    width:60,
    height:60,
    marginRight:10,
    marginLeft:10,
    borderRadius:30
  },

  contentBox: {
    flex:1,
  },

  nickname: {
    fontSize:16,
    color:'#666',
  },

  title: {
    marginTop:5,
    fontSize:18,
    color:'#666',
  },

  replyBox: {
    width:width,
    flexDirection:'row',
    justifyContent:'center',
    marginTop:10
  },

  replyAvatar: {
    width:30,
    height:30,
    marginRight:10,
    marginLeft:10,
    borderRadius:15
  },

  reply: {
    flex:1,
  },

  replyNickname: {
    fontSize:14,
    color:'#666',
  },

  replyContent: {
    marginTop:5,
    fontSize:16,
    color:'#666',
  },

  video: {
    width:width,
    height:width * 0.66,
    backgroundColor:'#000'
  },

  failText: {
    position: 'absolute',
    top:180,
    left:0,
    width: width,
    height: 20,
    textAlign: 'center',
    color:'#fff',
    backgroundColor:'transparent'
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
    top:80,
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
  },

  pauseButton: {
    position:'absolute',
    left:0,
    top:0,
    width: width,
    height: width * 0.66,
  },

  resumeIcon: {
    position: 'absolute',
    top:80,
    left:width / 2 - 30,
    width: 60,
    height: 60,
    paddingTop: 5,
    paddingLeft: 20,
    backgroundColor: 'transparent',
    alignSelf:'center',
    borderColor: '#ed7b66',
    borderWidth: 1,
    borderRadius: 30,
    color: '#ed7b66'
  },


});