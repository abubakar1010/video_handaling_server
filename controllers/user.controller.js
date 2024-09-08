import asyncHandler from "../utils/asyncHandler.js";

const registerUser = asyncHandler((req, res) => {
	res.status(401).json({
		message: "ok"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
	});
});

export {registerUser}
