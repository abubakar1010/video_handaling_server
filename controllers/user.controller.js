import { User } from "../models/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApisError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.service.js";
import jwt from 'jsonwebtoken';

const generateAccessTokenAndRefreshToken = async (userId) => {
	try {
		// console.log(userId);
		
		const user = await User.findById(userId);

		// console.log(user);
		
		const accessToken = user.generateAccessToken();
		// console.log(accessToken);
		
		const refreshToken = user.generateRefreshToken(userId);

		user.refreshToken = refreshToken;

		await user.save({ validateBeforeSave: false });

		return { accessToken, refreshToken };
	} catch (error) {
		throw new ApiError(
			500,
			"Something went wrong while generate jwt token"
		);
	}
};

const registerUser = asyncHandler(async (req, res) => {
	/**
	 * Steps:
	 *
	 * 1. get data from user
	 * 2. validation - any field are not empty
	 * 3. check user already exist - email, username
	 * 4. check for image and avatar
	 * 5. upload on cloudinary
	 * 6. create user object
	 * 7. send data in db
	 * 8. remove password and refresh token from res
	 * 9. check user created
	 * 10. send response
	 */

	const { userName, userEmail, fullName, password } = req.body;
	console.log({
		userName,
		userEmail,
		fullName,
		password,
	});

	if (
		[userName, userEmail, fullName, password].some(
			(field) => !field?.trim()
		)
	) {
		throw new ApiError(400, "All fields are require");
	}

	const existedUser = await User.findOne({
		$or: [{ userEmail }, { userName }],
	});

	console.log(existedUser);

	if (existedUser) throw new ApiError(409, "User already exist");

	const avatarLocalPath = req.files?.avatar[0]?.path;
	let coverImageLocalPath;
	if (req.file?.coverImage) {
		coverImageLocalPath = req.files?.coverImage[0]?.path;
	}

	if (!avatarLocalPath)
		throw new ApiError(404, "Avatar Local Path is required");

	const avatar = await uploadOnCloudinary(avatarLocalPath);
	let coverImage;
	if (coverImageLocalPath) {
		coverImage = await uploadOnCloudinary(coverImageLocalPath);
	}

	if (!avatar) throw new ApiError(404, "Avatar is required");

	const user = await User.create({
		userName: userName.toLowerCase(),
		userEmail,
		fullName,
		avatar: avatar.url,
		coverImage: coverImage?.url || "",
		password,
	});

	const createdUser = await User.findById(user._id).select(
		" -password -refreshToken"
	);
	console.log(createdUser);

	if (!createdUser)
		throw new ApiError(
			500,
			"Something Went wrong while registering a user"
		);

	res.status(201).json(
		new ApiResponse(201, createdUser, "User successfully registered")
	);
});

const loginUser = asyncHandler(async (req, res) => {
	/**
	 * steps:
	 *
	 * 1. get data from user (email, password)
	 * 2. check field ar empty
	 * 3. check data are valid
	 * 4. jwt middleware
	 * 5. send data in cookies
	 *
	 */

	const { userEmail, userName, password } = req.body;

	if (!userEmail || !userName)
	{
		throw new ApiError(404, "user name or email is required");
	}

	const user = await User.findOne({
		$or: [{ userEmail }, { userName }],
	});

	if (!user) throw new ApiError(404, "user not found");

	const validPassword = await user.isPasswordCorrect(password);

	if (!validPassword) throw new ApiError(401, "Password is invalid");

	const { accessToken, refreshToken } =
		await generateAccessTokenAndRefreshToken(user?._id);

	const loggedInUser = await User.findById(user?._id).select(
		" -password -refreshToken"
	);

	const option = {
		httpOnly: true,
		secure: true,
	};

	res.status(200)
		.cookie("accessToken", accessToken, option)
		.cookie("refreshToken", refreshToken, option)
		.json(
			new ApiResponse(
				200,
				{
					user: loggedInUser,
					accessToken,
					refreshToken,
				},
				"User Logged in successfully"
			)
		);
});

const logOutUser = asyncHandler(async (req, res) => {
	await User.findByIdAndUpdate(
		req.user?._id,
		{
			$set: {
				refreshToken: null,
			},
		},
		{ new: true }
	);

	const option = {
		httpOnly: true,
		secure: true
	}

	res
	.status(200)
	.clearCookie("accessToken", option)
	.clearCookie("refreshToken", option)
	.json(new ApiResponse(200,{},"User Logged Out"))
});

const refreshAccessToken = asyncHandler(async( req, res ) => {

	const incomingRefreshToken = req.cookies.refreshToken
	console.log(req.cookies);
	

	if(!incomingRefreshToken) throw new ApiError(404, "Incoming Token not found")

		const decodedToken =  jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

		const user = await User.findById(decodedToken.id)

		if(!user) throw new ApiError(401, "unAuthorized refresh token")

		if(incomingRefreshToken !== user.refreshToken) throw new ApiError(401, "Refresh token expired or used")

		const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

		const option = {
			httpOnly: true,
			secure: true
		}

		res
		.status(200)
		.cookie("accessToken", accessToken, option)
		.cookie("refreshToken", refreshToken, option)
		.json(new ApiResponse(200,{accessToken, refreshToken}, "Access Token Refresh"))
})

const changeCurrentPassword = asyncHandler( async (req, res) => {

	const {currentPassword, updatedPassword} = req.body;

	const user =  await User.findById(req.user._id)

	const isGivenCurrentPasswordMatched = user.isPasswordCorrect(currentPassword)

	if(!isGivenCurrentPasswordMatched) throw new ApiError(400, "Password invalid")

		user.password = updatedPassword;

		await user.save({validateBeforeSave: false})

		res
		.status(200)
		.json(new ApiResponse(200, {}, "Password Changed Successfully"))
})

const getCurrentUser = asyncHandler( async( req, res ) => {
	
	res
	.status(200)
	.json(200, req.user, "Current User Get successfully")
})


const updateUser = asyncHandler( async (req, res) => {

	const {fullName, userEmail} = req.body;

	if( !fullName || !userEmail) throw new ApiError(404, "full name or email are not found")

	const user = await User.findByIdAndUpdate(
		req.user?.id,
		{
			$set:{
				fullName,
				userEmail
			}
		},
		{new: true}
	).select(" -password -refreshToken")

	res
	.status(200)
	.json(new ApiResponse(200, user, "User update Successful"))
})

const updateAvatar = asyncHandler( async (req, res ) => {

	const path = req.file?.path

	if(!path) throw new ApiError(400, "Avatar File Not Found")

	const avatar = await uploadOnCloudinary(path)

	if( avatar?.url) throw new ApiError(400,"Error while uploading avatar on cloudinary")

	const user = await User.findByIdAndUpdate(req.user.id,
		{
			$set:{
				avatar: avatar.url
			}
		},
		{new: true}
	).select(" -password -refreshToken")

	res
	.status(200)
	.json(new ApiResponse(200, user, "Avatar update successfully"))
})
const updateCoverImage = asyncHandler( async (req, res ) => {

	const path = req.file?.path

	if(!path) throw new ApiError(400, "Cover image file Not Found")

	const avatar = await uploadOnCloudinary(path)

	if( avatar?.url) throw new ApiError(400,"Error while uploading cover image on cloudinary")

	const user = await User.findByIdAndUpdate(req.user.id,
		{
			$set:{
				avatar: avatar.url
			}
		},
		{new: true}
	).select(" -password -refreshToken")

	res
	.status(200)
	.json(new ApiResponse(200, user, "Cover Image update successfully"))
})



export { registerUser, loginUser, logOutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser };