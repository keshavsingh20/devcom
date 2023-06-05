import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

async function connect() {
    const getUri = process.env.MONGODB;
    
    // mongoose.set('strictQuery', true)
    const db = await mongoose.connect(getUri);
    console.log("Database Connected Successfully...!");

    return db;
}


export default connect;