const express = require("express");
const chatController = require("../controllers/chatController");
const router = express.Router();

router.get("/threads", chatController.getThreads);
router.get("/messages", chatController.getMessages);
router.post("/send", chatController.sendMessage);

module.exports = router;