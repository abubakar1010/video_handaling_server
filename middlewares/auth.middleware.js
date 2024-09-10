import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApisError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const verifyToken = asyncHandler( async(req, _, next ) => {

    try {
        // console.log(req.cookies);
        
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token) throw new ApiError(404, "Token not found")
    
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

            console.log(decodedToken);
            
    
            const user = await User.findById(decodedToken.id).select(" -password -refreshToken")
    
            if(!user) throw new ApiError(401, "Invalid Access Token")
    
                req.user = user;
                next()
    } catch (error) {
        throw new ApiError(401, error?.message)
    }
})

export default verifyToken