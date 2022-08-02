const app = require('express')();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
  cors: {origin : '*'}
});

const port = process.env.PORT || 3000;
let socketId;
let xCount =0;
let oCount= 0;

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('message', (data) => {
    data.userId= socket.id
    if(!socketId){
      socketId = socket.id
    }
    if(socketId == data.userId){
      data.value ='X';
      xCount++;
    }else{
      data.value ='O';
      oCount++;
    }
    io.emit('message', data);
  });
  socket.on('disconnect', () => {
    console.log('a user disconnected!');
    socketId = null
  });
});

httpServer.listen(port, () => console.log(`listening on port ${port}`));