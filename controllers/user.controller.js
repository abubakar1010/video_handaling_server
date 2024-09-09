import { User } from "../models/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApisError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.service.js";


const generateAccessTokenAndRefreshToken = async(userId) => {

	try {
		const user = await User.findById(userId);
		const accessToken = user.generateAccessToken()
		const refreshToken = user.generateRefreshToken(userId)

		user.refreshToken = refreshToken;

		await user.save({validateBeforeSave: false})

		return {accessToken, refreshToken}
	} catch (error) {
		throw new ApiError(500, "Something went wrong while generate jwt token")
	}
}

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

	const {userEmail, userName, password} = req.body;

	if( !userEmail || !userName) throw new ApiError(404, "user name or email is required")

		const user =  await User.findOne({
			$or:[{ userEmail }, {userName}]
		})

		if(!user) throw new ApiError(404, "user not found")

		const validPassword = await user.isPasswordCorrect(password)

		if(!validPassword) throw new ApiError(401, "Password is invalid")

		const {accessToken, refreshToken} =await generateAccessTokenAndRefreshToken(user?._id)


});

export { registerUser, loginUser };
