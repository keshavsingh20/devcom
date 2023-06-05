import { Router } from "express";
import Message from "../Modals/Message.js";
import { body, validationResult } from "express-validator";
import verifyToken from "./VerifyToken.js";
const router = Router();

// create message 
router.post("/msg", verifyToken, async (req, res) => {
    try {
        const { from, to, message } = req.body;
        const newMessage = await Message.create({
            message: message,
            ChatUsers: [from, to],
            Sender: from
        })

        return res.status(200).json(newMessage)
    } catch (error) {
        return res.status(500).json("Internal Server Error...!")
    }

})


// fetch message 
router.get("/get/chat/msg/:user1Id/:user2Id", async (req, res) => {
    try {
        const from = req.params.user1Id;
        const to = req.params.user2Id;

        const newMessage = await Message.find({
            ChatUsers: {
                $all: [from, to]
            }
        }).sort({ updatedAt: 1 });

        const allMessage = newMessage.map((msg) => {
            return {
                myself: msg.Sender.toString() === from,
                message: msg.message
            }
        })

        return res.status(200).json(allMessage)
    }
    catch (error) {
        return res.status(500).json("Internal Server Error...!")
    }

})


export default router;