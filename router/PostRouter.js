import { Router } from "express";
import Post from "../Modals/Post.js";
import { body, validationResult } from "express-validator";
import verifyToken from "./VerifyToken.js";

const router = Router();

// api for create post 
router.post("/user/post", verifyToken, async (req, res) => {
    try {
        let { title, image, video } = req.body;
        let newPost = new Post({
            title, image, video, user: req.user.id
        })

        const post = await newPost.save();
        res.status(200).json(post)
    }
    catch (error) {
        return res.status(500).json("Intrnal error occured...!")
    }
})


// api for uploaded posts by one user
router.get("/get/post/:id", async (req, res) => {
    try {
        const mypost = await Post.find({ user: req.params.id })
        if (!mypost) {
            return res.status(200).json("You don't have any post")
        }
        let sortedPosts = mypost.sort(
            (p1, p2) => (p1.updatedAt < p2.updatedAt) ? 1 : (p1.updatedAt > p2.updatedAt) ? -1 : 0);
      
          // return res.status(200).json(userPost.concat(...followersPost))
          // console.log(sortedPosts)
            return res.status(200).json(sortedPosts)
    } catch (error) {
        console.log(error)
        res.status(500).json("Internal Server error...!")
    }
})

// api for update user post 
router.put("/update/post/:id", verifyToken, async (req, res) => {
    try {
        let post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(400).json("Post doesn't found")
        }

        post = await Post.findByIdAndUpdate(req.params.id, {
            $set: req.body
        })
        let updatePost = await post.save();
        res.status(200).json(updatePost)
    } catch (error) {
        // console.log(error)
        return res.status(500).json("Internal error occured...!");
    }
})

// like
router.put("/:id/like", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post.like.includes(req.body.user)) {
            if (post.dislike.includes(req.body.user)) {
                await post.updateOne({ $pull: { dislike: req.body.user } })
            }
          await post.updateOne({ $push: { like: req.body.user } })
            return res.status(200).json("Post has been liked")
            // return res.status(200).json(likePost)

        }
        else {
            await post.updateOne({ $pull: { like: req.body.user } })
            return res.status(200).json("Post has been removed from liked")
        }
    } catch (error) {
        // console.log(error)
        return res.status(500).json("Internal server error occured...!");
    }

})

// dislike
router.put("/:id/dislike", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post.dislike.includes(req.body.user)) {
            if (post.like.includes(req.body.user)) {
                await Post.updateOne({ $pull: { like: req.body.user } })
            }
            await Post.updateOne({ $push: { dislike: req.body.user } })
            return res.status(200).json("Post has been disliked")
        }
        else {
            await post.updateOne({ $pull: { dislike: req.body.user } })
            return res.status(200).json("Post has been removed from disliked")
        }
    } catch (error) {
        // console.log(error)
        return res.status(500).json("Internal server error occured...!");
    }

})


// comment
router.put("/comment/post", verifyToken, async (req, res) => {
    try {
        // console.log(req.body)
        const { comment, postid } = req.body;
        const comments = {
            user: req.user.id,
            username: req.user.username,
            comment,
            profile: req.body.profile
        }
        const post = await Post.findById(postid);
        post.comments.push(comments);
        await post.save();
        res.status(200).json(post);
    } catch (error) {
        console.log(error)
        return res.status(500).json("Internal server error occured...!");
    }
})


// api for delete a post
router.delete("/delete/post/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        // console.log(req.user)
        // console.log(post.user)
        // if (post.user == req.body.users._id) {
            const deletePost = await Post.findByIdAndDelete(req.params.id);
            return res.status(200).json("Your Post has been deleted successfully...!")
        // }
        // else {
        //     return res.status(400).json("You are not allowed to delete this post...!")
        // }
    } catch (error) {
        //  console.log(error)
        return res.status(500).json("Internal server error occured...!");
    }
})

export default router;



