import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

import request from '../common/request';
import config from '../common/config';
import {
  StyleSheet,
  Text,
  View,
  ListView,
  TouchableHighlight,
  Image,
  Dimensions
} from 'react-native';

var width = Dimensions.get('window').width

var cachedResults = {
  nextPage: 1,
  items:[],
  total:0
}

export default class List extends Component {
	constructor(props) {
	  super(props);
	  const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
	  this.state = {
      isLoadingTail: false,
	  	dataSource: ds.cloneWithRows([])
	  };
    console.log(this.state);
	}

  componentDidMount(){
    this._fetchData(1)
  }

  _renderRow(row) {
  	return(
  		<TouchableHighlight>
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
  						name='ios-heart-outline'
  						size={28}
  						style={styles.up}
  					/>
  					<Text style={styles.handleText}>喜欢</Text>
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

  _fetchData(page){
    this.setState({
      isLoadingTail:true
    })

    request.get(config.api.base + config.api.creations,{
      accessToken: 'abcdef',
      page: page
    })
      .then((data) => {
        if (data.success) {
          var items = cachedResults.items.slice()
          items = items.concat(data.data)
          cachedResults.items = items
          cachedResults.total = data.total
          cachedResults.nextPage += 1
          this.setState({
            isLoadingTail:false,
            dataSource: this.state.dataSource.cloneWithRows(cachedResults.items)
          })
        }
        console.log(data);
      })
      .catch((error) => {
        this.setState({
            isLoadingTail:false
          })
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

  render() {
    return (
      <View style={styles.container}>
      	<View style={styles.header}>
        	<Text style={styles.headerTitle}>列表页面</Text>
      	</View>
      	<ListView
        dataSource={this.state.dataSource}
        renderRow={this._renderRow}
        onEndReached={this._fetchMoreData}
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

  up: {
  	fontSize: 22,
  	color:'#333'
  },

  commentIcon: {
  	fontSize: 22,
  	color:'#333'
  }

});