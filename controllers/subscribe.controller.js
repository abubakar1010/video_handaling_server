import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApisError.js";
import asyncHandler from "../utils/asyncHandler.js";


const subscribeChannel = asyncHandler( async ( req, res ) => {

    const {channel} = req.params
    const user = req.user

    // console.log("channel:",channel, req.user);

    
    const currentChanel = await User.findOne({userName: channel})
    
    if(!currentChanel) throw new ApiError(404, "user not found")
        
        const isAlreadySubscribed = await Subscription.findById(currentChanel._id)

    if(!isAlreadySubscribed) throw new ApiError(404, "already subscribed")


        // console.log(user._id, currentChanel._id);
        
    if( user._id.toString() == currentChanel._id.toString()) throw new ApiError(400, "You are not able to subscribe yourself")

        const subscribed = await Subscription.create({
            subscriber: user._id,
            channel: currentChanel._id
        })

        if(!subscribed) throw new ApiError("500", "something went wrong when subscribed channel")

            res.status(200).json(new ApiResponse(200,subscribed, "Subscribed successful"))
    
})


export {subscribeChannel} 