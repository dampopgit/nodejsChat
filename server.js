var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');



app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


var Message = mongoose.model('Message',{
  name : String,
  message : String,
  //userimage: String,
  time : { type : Date, default: Date.now }
})

var dbUrl = 'mongodb://damir:2wsxzaq1@ds119374.mlab.com:19374/chatting';

app.get('/messages', (req, res) => {
  Message.find({},(err, messages)=> {
    res.send(messages);
  })
})


app.get('/messages/:user', (req, res) => {
  var user = req.params.user
  Message.find({name: user},(err, messages)=> {
    res.send(messages);
  })
})


app.post('/messages', async (req, res) => {
  try{
    var message = new Message(req.body);

    var savedMessage = await message.save()
      console.log('saved');

    var censored = await Message.findOne({message:'badword'});
      if(censored)
        await Message.remove({_id: censored.id})
      else
        io.emit('message', req.body);
      res.sendStatus(200);
  }
  catch (error){
    res.sendStatus(500);
    return console.log('error',error);
  }
  finally{
    console.log('Message Posted')
  }

})



io.on('connection', (socket) =>{
  console.log('a user is connected', socket.id);

  setTimeout(function() {
  //  Sending an object when emmiting an event
    socket.emit('testerEvent', { description: 'A custom event named testerEvent!'});
 }, 4000);

 socket.on('clientEvent', function(data) {
      console.log(data);
  socket.on('disconnect', function(){
    console.log('user disconnected', socket.id);
    socket.emit('leaving', { description: socket.id + 'Has left the chat room!'});
  });
})
});



mongoose.connect(dbUrl ,{ useNewUrlParser: true } ,(err) => {
  console.log('mongodb connected',err);
})

var server = http.listen(3000 , () => {
  console.log('server is running on port', server.address().port);
});

module.exports = Message;
