import dotenv from 'dotenv/config';
import connectDB from "./db/index.js";
import app from './app.js';



connectDB()
.then(() => {
    app.on( "Error", (error) => {
        console.log("Error: ", error);
        throw error;
        
    })
    app.listen(process.env.PORT || 5000, () => {
        console.log(`app is running on port ${process.env.PORT}`);
        
    })
})
.catch((error) => {
    console.log("MongoDB Connection Failed", error);
    
})










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