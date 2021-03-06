'use strict'

module.exports = {
	header:{
		method: 'POST',
  	headers: {
	    'Accept': 'application/json',
	    'Content-Type': 'application/json',
  	}
	},
	api:{
		// base:'http://rap.taobao.org/mockjs/12531/',
		base:'http://10.4.93.39:1234/',
		creations:'api/creations',
		comments:'api/comments',
		up:'api/up',
		signup:'api/u/signup',
  		update:'api/u/update',
		verify:'api/u/verify',
		signature:'api/signature',
		video:'api/creations/video',
		audio:'api/creations/audio'
	  },
	qiniu: {
		upload: 'http://upload.qiniu.com',
		resBase: 'http://olicmv3xh.bkt.clouddn.com/',
		videoBase: 'http://olo1wj1st.bkt.clouddn.com/'
	},
	cloudinary: {
	  cloud_name: 'lizhao',  
	  api_key: '134811467767913',  
	  base: 'https://api.cloudinary.com/v1_1/lizhao',
	  resBase: 'http://res.cloudinary.com/lizhao',
	  image: 'https://api.cloudinary.com/v1_1/lizhao/image/upload',
	  video: 'https://api.cloudinary.com/v1_1/lizhao/video/upload',
	  audio: 'https://api.cloudinary.com/v1_1/lizhao/raw/upload'
	}

}