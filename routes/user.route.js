import { Router } from "express";
import { getUserChannelProfile, loginUser, logOutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyToken from "../middlewares/auth.middleware.js";
import { subscribeChannel } from "../controllers/subscribe.controller.js";

const router = Router()

router.route("/register").post(upload.fields(
    [
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]
),registerUser)

router.route("/login").post(loginUser)

// secured routes 

router.route("/logout").post(verifyToken, logOutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/channel/:userName").post(getUserChannelProfile)
router.route("/subscribe/:channel").post(verifyToken,subscribeChannel)

export default router