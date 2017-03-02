//noinspection JSUnresolvedVariable
import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import request from '../common/request';
import config from '../common/config';
import Button from 'react-native-button'

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
  TextInput,
  Modal,
  AlertIOS
} from 'react-native';

var width = Dimensions.get('window').width

var cachedResults = {
  nextPage: 1,
  items:[],
  total:0
}

function qiniuMediaURL(key,type) {
  if (type === 'avatar') {
    return config.qiniu.resBase + key
  } 
  else if(type === 'video'){
    return config.qiniu.videoBase + key
  }
}

export default class Detail extends Component {

  constructor(props) {
    super(props);

    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    var data = this.props.data
    var user = this.props.user

    this.state = {
      videoProgress: 0.01,
      currentTime: 0,
      videoLoaded: false,
      playing:false,
      onEnd:false,
      paused:false,
      videoOk:true,
      data:data,
      user: user,
      dataSource: ds.cloneWithRows([]),
      isLoadingTail: false,
      animationType:'none',
      modalVisible:false,
      isSending: false,
      content: ''
    }
  }

  render() {
    var data = this.state.data
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
                source={{uri: qiniuMediaURL(data.qiniu_video, 'video')}}
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

          <ListView
            dataSource={this.state.dataSource}
            renderRow={this._renderRow}
            enableEmptySections={true}
            renderHeader={this._renderHeader.bind(this)}
            renderFooter={this._renderFooter.bind(this)}
            onEndReached={this._fetchMoreData.bind(this)}
            onEndReachedThreshold={20}
            automaticallyAdjustContentInsets={false}
          />

          <Modal
            animationType={'fade'}
            visible={this.state.modalVisible}
            onRequestClose={() => {this._setModalVisible(false)}}>
              <View style={styles.modalContainer}>
                  <Icon
                    onPress={this._closeModal}
                    name="ios-close-outline"
                    style={styles.closeIcon}
                  />

                  <View style={styles.commentBox}>
                      <View style={styles.comment}>
                          <TextInput
                            placeholder='敢不敢评论一个。。。'
                            style={styles.commentContent}
                            multiline={true}
                            onFocus={this._focus}
                            onBlur={this._blur}
                            defaultValue={this.state.content}
                            onChangeText={(text) => {
                              this.setState({
                                content:text
                              })
                            }}
                          />
                      </View>
                  </View>
                  <Button style={styles.submitBtn} onPress={this._submit}>提交</Button>
              </View>
          </Modal>
      </View>
    )
  }

  componentDidMount() {
    this._fetchData()
  }

  _renderRow = (row) => {
    return (
      <View key={row._id} style={styles.replyBox}>
          <Image style={styles.replyAvatar} source={{uri:qiniuMediaURL(row.replyBy.avatar,'avatar')}} />
          <View style={styles.reply}>
              <Text style={styles.replyNickName}>{row.replyBy.nickname}</Text>
              <Text style={styles.replyContent}>{row.content}</Text>
          </View>
      </View>
    )
  }

  _fetchData(page){

    this.setState({
      isLoadingTail:true
    })

    request.get(config.api.base + config.api.comments,{
      creation:this.state.data._id,
      accessToken:this.state.user.accessToken,
      page: page
    })
      .then((data) => {
        if (data.success) {
          // var items = cachedResults.items.slice()

          // items = items.concat(data.data)
          cachedResults.nextPage += 1
          cachedResults.items = data.data
          cachedResults.total = data.data.length

          this.setState({
            isLoadingTail:false,
            dataSource: this.state.dataSource.cloneWithRows(cachedResults.items)
          })
        }
        console.log(data);
      })
      .catch((error) => {
        if (page !==0 ) {
          this.setState({
            isLoadingTail:false
          })
        } else {
          this.setState({
            refreshing:false
          })
        }
        console.error(error);
      });
  }

  _hasMore(){
    return (cachedResults.items.length !== cachedResults.total)
  }

  _fetchMoreData(){
    if (!this._hasMore() || this.state.isLoadingTail) {
      return
    }

    var page = cachedResults.nextPage
    this._fetchData(page)
  }

  _focus = () => {
    this._setModalVisible(true)
  }
  _blur = () => {
    // this._setModalVisible(true)
  }
  _closeModal = () => {
    this._setModalVisible(false)
  }

  _setModalVisible = (isVisible) => {
    this.setState({
      modalVisible:isVisible
    })
  }
  _renderHeader(){
    var data = this.state.data
    return (
      <View style={styles.listHeader}>
          <View style={styles.infoBox}>
              <Image style={styles.avatar} source={{uri:qiniuMediaURL(data.author.avatar, 'avatar')}}>
              </Image>
              <View style={styles.contentBox}>
                  <Text style={styles.nickname}>{data.author.nickname}</Text>
                  <Text style={styles.title}>{data.title}</Text>
              </View>
          </View>
          <View style={styles.commentBox}>
              <View style={styles.comment}>
                  <TextInput
                    placeholder='敢不敢评论一个。。。'
                    style={styles.commentContent}
                    multiline={true}
                    onFocus={this._focus}
                  />
              </View>
          </View>

          <View style={styles.commentArea}>
              <Text style={styles.commentTitle}>精彩评论</Text>
          </View>
      </View>

    )
  }

  _renderFooter(){
    if (!this._hasMore() && cachedResults.total !==0) {
      return(
        <View style={styles.loadingMore}>
            <Text style={styles.loadingText}>没有更多了</Text>
        </View>
      )
    }

    return (
      <ActivityIndicator style={styles.loadingMore} />
    )
  }

  _submit = () => {
    if (!this.state.content) {
      return AlertIOS.alert('评论不能为空')
    }
    if (this.state.isSending) {
      return AlertIOS.alert('正在评论中')
    }

    this.setState({
      isSending: true
    }, function() {
      var body = {
        accessToken: this.state.user.accessToken,
        creation: this.state.data._id,
        content:this.state.content
      }
      var url = config.api.base + config.api.comments
      request.post(url, body)
      .then((data) => {
        console.log(data)
        if (data && data.success) {
          var items = cachedResults.items.slice()
          // var content = this.state.content
          //   items = [{
          //     content: content,
          //     replyBy: {
          //       avatar:"http://dummyimage.com/300x300/7d0063)",
          //       nickname:"lizhao"
          //   }
          // }].concat(items)

          cachedResults.items = items
          // cachedResults.total = cachedResults.total
          this.setState({
            content: '',
            isSending: false,
            dataSource: this.state.dataSource.cloneWithRows(cachedResults.items)
          }) 
          this._setModalVisible(false)
        } else {
          // AlertIOS.alert(data.err)
          console.log(data.err)
        }
      })
      .catch((error) => {
        console.log(error)
        this.setState({
          isSending: false
        })
        this._setModalVisible(false)
        AlertIOS.alert('评论失败')
      })
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

  loadingMore: {
    marginVertical: 20,
  },

  loadingText: {
    color: '#777',
    textAlign: 'center'
  },

  listHeader: {
    width:width,
    marginTop:10
  },
  commentBox:{
    marginTop: 10,
    marginBottom:10,
    padding:8,
    width: width
  },

  commentContent: {
    paddingLeft:2,
    color:'#333',
    borderWidth:1,
    borderColor:'#ddd',
    borderRadius:4,
    fontSize:14,
    height:80
  },
  commentArea: {
    width:width,
    paddingBottom:6,
    paddingLeft:10,
    paddingRight:10,
    borderBottomWidth:1,
    borderBottomColor:'#eee'
  },
  modalContainer: {
    flex: 1,
    paddingTop:45,
    backgroundColor:'#fff'
  },
  closeIcon:{
    alignSelf:'center',
    fontSize:30,
    color:'#ee753c'
  },
  submitBtn: {
    alignSelf: 'center',
    width: width - 20,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ee753c',
    borderRadius: 4,
    color: '#ee753c',
    fontSize: 16
  }
});