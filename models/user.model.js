import mongoose, {Schema} from "mongoose";

const userSchema = new Schema(
    {
        userName:{
            type: String,
            required: true,
            lowerCase: true,
            unique: true,
            index: true,
            trim: true
        },
        userEmail:{
            type: String,
            required: true,
            lowerCase: true,
            unique: true,
            trim: true
        },
        fullName:{
            type: String,
            required: true,
            trim: true,
            index: true
        },
        password:{
            type: String,
            required: true,
        },
        avatar:{
            type: String,
            required: true
        },
        coverImage:{
            type: String
        },
        watchHistory:[
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
                required: true
            }
        ],
        refreshToken:{
            type: String
        }


    },
    {
        timestamps: true
    }
)

export const User = mongoose.model("User", userSchema)