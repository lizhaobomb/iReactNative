import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

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

export default class List extends Component {
	constructor() {
	  super();
	  const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
	  this.state = {
	  	dataSource: ds.cloneWithRows([
	  		{
        "_id":"500000197607248599","thumb":"https://dummyimage.com/1200x600/3fabef)","video":"http://szv1.mukewang.com/583d5988b3fee311398b457c/H.mp4"
    		}
    		,
    		{
        "_id":"810000197605166277","thumb":"https://dummyimage.com/1200x600/8c5c29)","video":"http://szv1.mukewang.com/583d5988b3fee311398b457c/H.mp4"
    		}
    		,
    		{
        "_id":"520000199502158573","thumb":"https://dummyimage.com/1200x600/b8d88d)","video":"http://szv1.mukewang.com/583d5988b3fee311398b457c/H.mp4"
    		}
    		]),
	  };
	}

renderRow(row) {
	return(
		<TouchableHighlight>
			<View style={styles.item}>
				<Text style={styles.title}>{row._id}</Text>
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

render() {
  return (
    <View style={styles.container}>
    	<View style={styles.header}>
      	<Text style={styles.headerTitle}>列表页面</Text>
    	</View>
    	<ListView
      dataSource={this.state.dataSource}
      renderRow={this.renderRow}
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
  	height: width * 0.5,
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