
/*http-server*/

var static = require('node-static');
var http = require('http');

var file = new(static.Server)();
var app = http.createServer(function (req, res) {
	file.serve(req, res);
}).listen(8080);


/*Socket*/

var WebSocketServer = new require('ws');
var webSocketServer = new WebSocketServer.Server({port: 8081});

webSocketServer.on('connection', function(ws) {
	var id = ~clients.lastIndexOf(null)? clients.lastIndexOf(null):clients.length;
	clients[id] = new User(id, ws);
	console.log("new conection ", id);
});


/*##################*/


var clients = [];

var User = function(id, ws){
	ws.client = this;
	this.id = id;
	this.ws = ws;

	var self = clients[id];
	ws.on('message', function(message) {
		//console.log('get', message);
		message = JSON.parse(message);
		this.client.onMessage(message.type,  message.content, message.to);
	});

	ws.on('close', function() {
		console.log('clouse conecting ' + id);
		clients[id].exit();
	});
};

User.prototype.exit = function(){
	this.close = true;
	this.sendAll('clientList', clients.map(function(user) {
		return user.close?false:{name: user.name, id:user.id};
	}));
	clients[this.id] = null;
};

User.prototype.send = function(type, message, from){
	message = JSON.stringify({type:type, content:message, from:from});
	this.ws.send(message);
	//console.log('send', this.id, message);
};

User.prototype.sendAll = function(type, message, self){
	for (var i=0; i<clients.length; i++)if(clients[i]&&(i!=this.id||self))clients[i].send(type, message);
};


User.prototype.onMessage = function(type, content, to){
	if(type == 'setName'){
		this.name = content;
		this.send('setId', this.id);
		this.sendAll('clientList', clients.map(function(user) { return {name: user.name, id:user.id};}), true);
	}else if(type == 'webrtc'){
		clients[to].send('webrtc', content, this.id);
	}else if(type == 'msg'){
		clients[to].send('msg', content, this.id);
		this.send('msg', content, this.id);
	}else if(type == 'call'){
		clients[to].send('call', content, this.id);
	}else if(type == 'call_end'){
		clients[to].send('call_end', content, this.id);
	}
};
