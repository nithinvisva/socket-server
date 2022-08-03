const app = require('express')();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
  cors: { origin: '*' }
});

const port = process.env.PORT || 3000;
let socketId = { X: null, Y: null }
let xCount = 0;
let oCount = 0;

app.get("/", (req, res) => {
  res.send({ message: "Hello World!" })
})

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('message', (data) => {
    data.userId = socket.id
    if (!socketId.X) {
      socketId.X =  data.userId
    }else if(socketId.X != data.userId && !socketId.Y){
      socketId.Y =  data.userId
    }
    console.log(`xid ${socketId.X} , x ${xCount}, y ${oCount}`)
    if (socketId.X == data.userId && xCount == oCount) {
      data.value = 'X';
      xCount++;
      io.emit('message', data);
    }
    console.log(`xid ${socketId.Y} , x ${xCount}, y ${oCount}`)
    if (socketId.Y == data.userId && xCount > oCount) {
      data.value = 'O';
      oCount++;
      io.emit('message', data);
    }
  });
  socket.on('disconnect', () => {
    console.log('a user disconnected!');
    socketId.X = null;
    socketId.Y = null;
    xCount = 0;
    oCount=0; 
  });
});

httpServer.listen(port, () => console.log(`listening on port ${port}`));