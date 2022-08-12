const app = require('express')();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
  cors: { origin: '*' }
});
const _ = require('lodash')

const port = process.env.PORT || 3000;
let users=[]
let rooms=[]

app.get("/", (req, res) => {
  res.send({ message: "Hello World!" })
})

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('message', (data) => {
    const room =rooms.filter((user)=>{
      if(user.X == socket.id || user.Y == socket.id){
        return user
      }
    })[0]
    if (room?.X == socket.id && room.xCount == room.oCount) {
      data.value = 'X';
      updateCount(data.value, socket.id)
      io.to(room.roomName).emit('message', data);
    }
    if (room?.Y == socket.id && room.xCount > room.oCount) {
      data.value = 'O';
      updateCount(data.value, socket.id)
      io.to(room.roomName).emit('message', data);
    }
  });
  socket.on('user',(data)=>{
    if(!_.has(data,'isActive')){
      const newUser={
        userId: socket.id,
        name: data.name,
        isActive: true
      }
      users.push(newUser);
      io.except(socket.id).emit('user', newUser);
    }else{
      const updatedData = users.filter((user)=>{
        if(user.userId == socket.id){
          user.isActive = false
          return user
        }
      })
      io.except(socket.id).emit('user', updatedData[0]);
    }
  })
  socket.on('request-join',(data)=>{
    const user= users.filter((user)=>{
      if(user.userId == socket.id){
        return user
      }
    })
    const room= {X: socket.id, Y: data.userId, roomName: socket.id+data.userId, xCount:0,oCount:0}
    rooms.push(room)
    socket.join(room.roomName)
    io.to(data.userId).emit('request-join',user[0])
  })
  socket.on('accepted-join',(data)=>{
    const user= users.filter((user)=>{
      if(user.userId == socket.id){
        return user
      }
    })
    const room = rooms.filter((user)=>{
      if(user.X == socket.id || user.Y == socket.id){
        return user
      }
    })
    if(data.acceptance){
      const acceptData = {
        userId: user[0].userId,
        name: user[0].name,
        isActive: user[0].isActive,
        accepted: true
      }
      socket.join(room[0].roomName)
      io.to(data.userId).emit('accepted-join',acceptData)
    }
  })
  socket.on('room-deatils',async (data)=>{
    const room = await rooms.filter((user)=>{
      if(user.X == socket.id || user.Y == socket.id){
        return user
      }
    })
      const roomData={
        fromUser: getUser(room[0]?.X),
        toUser: getUser(room[0]?.Y),
      }
    io.to(room[0].roomName).emit('room-deatils',roomData)
  })
  socket.on('chat', (data) => {
    const user = getUser(socket.id)
    if(data.toUser.userId == '0'){
      data.fromUser = user 
      io.emit('chat', data)
    }else{
      data.fromUser = user
      io.to(data.toUser.userId).to(socket.id).emit('chat',data)
    }
  });

  socket.on('disconnect', () => {
    console.log('a user disconnected!');
    rooms = rooms.filter((user)=>{
      if(user.X != socket.id || user.Y != socket.id){
        return user
      }
    })
  });
});
updateCount= (value,id)=>{
if(value == 'X'){
  rooms.map((room)=>{
    if(room.X == id){
      room.xCount++;
    }
  })
}else{
  rooms.map((room)=>{
    if(room.Y == id){
      room.oCount++;
    }
  })
}
}

getUser= (id) =>{
  return users.filter((user)=>{
    if(user.userId == id){
      return user
    }
  })[0]
}

httpServer.listen(port, () => console.log(`listening on port ${port}`));