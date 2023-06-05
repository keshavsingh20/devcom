// to writer things in import style just add  "type": "module", in package.json file

import express, { Router } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import connect from "./database/conn.js";
import userRouter from "./router/UserRouter.js";
import postRouter from './router/PostRouter.js'
import messageRouter from './router/MessageRouter.js'
import cors from 'cors';
import { Server } from "socket.io";
// const path = require('path')
// import * as path from 'path'

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());
app.use("/api/user", userRouter)
app.use("/api/post", postRouter)
app.use("/api/message", messageRouter)

// static files
// app.use(express.static(path.join(__dirname, './client/build')))
// app.get('*', function(req, res){
//   res.sendFile(path.join(__dirname, './client/build/index.html' ))
// })
app.use(express.static('./client/build'))


const port = 5000;

// connect database first and then run server
connect()
  .then(() => {
    try {
      const server = app.listen(port, () => {
        // console.log("Server is running at ", port);
        console.log(`Server connected to http://localhost:${port}`);
      });
      console.log(server)

      // const io = socket(server, {
      //   cors:{
      //     origin: "http://localhost:3000",
      //     credentials: true
      //   }
      // })
      const io = new Server(server, {
        cors:{
          origin: "http://localhost:3000",
          credentials: true
        }
      })

      global.ononlineUsers = new Map();
      io.on("connection", (socket) => {
        global.chatsocket = socket;
        socket.on("addUser", (id) => {
          ononlineUsers.set(id, socket.id);
        })

        socket.on("send-msg", (data) => {
          const sendUserSocket = ononlineUsers.get(data.to);
          if (sendUserSocket) {
            socket.to(sendUserSocket).emit("msg-recieve", data.message)
          }
        })
      })

    } catch (error) {
      console.log("Can't Connect to the Server...!");
    }
  })
  .catch((error) => {
    // console.log(error)
    console.log("Invalid DataBase Connection...!");
  });



