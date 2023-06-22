import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    followers: {
        type: Array,
    },
    following: {
        type: Array,
    },
    phoneNo: {
        type: Number,
        required: true,
    },
    profile: {
        type: String,
    },
    bio: {
        type: String
    },
    title: {
        type: String
    },
    verified: {
        type: Boolean,
        required: true,
        default: true
    }
});

export default mongoose.model("User", UserSchema);
