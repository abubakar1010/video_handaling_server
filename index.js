import dotenv from 'dotenv/config';
import connectDB from "./db/index.js";



connectDB()

 










/*
import express from 'express'
const app = express()
(async()=>{
    try {
        await mongoose.connect(`${DB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERR: ", error);
            throw error
            
        })
        app.listen( process.env.PROT, () => {
            console.log(`app is running on prot ${process.env.PROT}`);
            
        })
    } catch (error) {
        console.log(error);
        throw error
    }
})()

*/