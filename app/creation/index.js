import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

import request from '../common/request';
import config from '../common/config';
import Detail from './detail';
import {
  StyleSheet,
  Text,
  View,
  ListView,
  TouchableHighlight,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  AlertIOS
} from 'react-native';

var width = Dimensions.get('window').width

var cachedResults = {
  nextPage: 1,
  items:[],
  total:0
}

class Item extends Component {

  constructor(props) {
    super(props);
    var row = this.props.row
    this.state = {
      up:row.voted,
      row:row
    };
  }

  _up() {
    var that = this
    var up = !this.state.up
    var row = this.state.row
    var url = config.api.base + config.api.up

    var body = {
      accessToken:'abcdef',
      up:up ? 'yes' : 'no',
      id:row._id
    }

    request.post(url,body)
    .then(function(data){
      if (data && data.success) {
        that.setState({up: up})
      } else {
        AlertIOS.alert('点赞失败，稍后重试')
      }
    })
    .catch(function(err){
      console.log(err)
      AlertIOS.alert('点赞失败，稍后重试')
    })
  }

  render() {
    var row = this.state.row
    return(
      <TouchableHighlight onPress={this.props.onSelect}>
        <View style={styles.item}>
          <Text style={styles.title}>{row.title}</Text>
          <Image
            source={{uri: row.thumb}}
            style={styles.thumb}
          >
            <Icon 
              name='ios-play'
              size={28}
              style={styles.play}
            />
          </Image>
          <View style={styles.itemFooter}>
            <View style={styles.handleBox}>
              <Icon 
              name={this.state.up ? 'ios-heart' : 'ios-heart-outline'}
              size={28}
              onPress={() => this._up()}
              style={[styles.up, this.state.up ? null : styles.down]}
            />
            <Text style={styles.handleText} onPress={() => this._up()}>喜欢</Text>
            </View>
            <View style={styles.handleBox}>
              <Icon 
              name='ios-chatboxes-outline'
              size={28}
              style={styles.commentIcon}
            />
            <Text style={styles.handleText}>评论</Text>
            </View>
          </View>
        </View>
      </TouchableHighlight>
      )
  }
}

export default class List extends Component {
	constructor(props) {
	  super(props);
	  const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
	  this.state = {
      isLoadingTail: false,
	  	dataSource: ds.cloneWithRows([]),
      refreshing: false
	  };
	}

  componentDidMount(){
    this._fetchData(1)
  }

  _renderRow(row) {
  	return <Item 
      key={row._id} 
      onSelect={() => this._loadPage(row)} 
      row={row} />
  }

  _loadPage(row) {
    this.props.navigator.push({
      name: 'detail',
      component: Detail,
      params: {
        data:row
      }
    })
  }

  _fetchData(page){
    if (page !== 0) {
      this.setState({
        isLoadingTail:true
      })
    } else {
      this.setState({
        refreshing:true
      })
    }

    request.get(config.api.base + config.api.creations,{
      accessToken: 'abcdef',
      page: page
    })
      .then((data) => {
        if (data.success) {
          var items = cachedResults.items.slice()

          if (page !== 0) {
            items = items.concat(data.data)
            cachedResults.nextPage += 1
          } else {
            items = data.data.concat(items)
          }

          cachedResults.items = items
          cachedResults.total = data.total

          if (page !== 0) {
            this.setState({
              isLoadingTail:false,
              dataSource: this.state.dataSource.cloneWithRows(cachedResults.items)
            })
          } else {
            this.setState({
              refreshing:false,
              dataSource: this.state.dataSource.cloneWithRows(cachedResults.items)
            })
          }
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

  _onRefresh(){
    if (this.state.refreshing || !this._hasMore()) {
      return;
    }

    this._fetchData(0)
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

  render() {
    return (
      <View style={styles.container}>
      	<View style={styles.header}>
        	<Text style={styles.headerTitle}>列表页面</Text>
      	</View>
      	<ListView
        dataSource={this.state.dataSource}
        renderRow={this._renderRow.bind(this)}
        renderFooter={this._renderFooter.bind(this)}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this._onRefresh.bind(this)}
            tintColor="#ff6600"
            title="拼命加载中..."
          />
        }
        onEndReached={this._fetchMoreData.bind(this)}
        onEndReachedThreshold={20}
        enableEmptySections={true}
        automaticallyAdjustContentInsets={false}
      />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  header: {
    paddingTop: 25,
    paddingBottom: 12,
    backgroundColor: '#ee735c',
  },
  headerTitle: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },

  item: {
  	width: width,
  	marginBottom: 10,
  	backgroundColor: '#fff'
  },

  thumb: {
  	width: width,
  	height: width * 0.56,
  	resizeMode: 'cover',
  	backgroundColor:'#333'
  },

  title: {
  	padding: 10,
  	fontSize: 18,
  	color: '#333'
  },

  itemFooter: {
  	flexDirection: 'row',
  	justifyContent: 'space-between',
  	backgroundColor: '#eee'
  },

  handleBox: {
  	padding: 10,
  	flexDirection: 'row',
  	width: width / 2 - 0.5,
  	justifyContent: 'center',
  	backgroundColor: '#fff'
  },

  play: {
  	position: 'absolute',
  	bottom: 14,
  	right: 14,
  	width: 46,
  	height: 46,
  	paddingTop: 9,
  	paddingLeft: 18,
  	backgroundColor: 'transparent',
  	borderColor: '#fff',
  	borderWidth: 1,
  	borderRadius: 23,
  	color: '#ed7b66'
  },

  handleText: {
  	paddingLeft: 12,
  	fontSize: 18,
  	color: '#333'
  },

  down: {
    fontSize: 22,
    color:'#333'
  },

  up: {
  	fontSize: 22,
  	color:'#ed7b66'
  },

  commentIcon: {
  	fontSize: 22,
  	color:'#333'
  },

  loadingMore: {
    marginVertical: 20,
  },

  loadingText: {
    color: '#777',
    textAlign: 'center'
  }

});