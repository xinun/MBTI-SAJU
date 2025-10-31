const express = require('express');
const router = express.Router();
const { Message } = require('./messages');

// GET /api/messages : 메시지 목록을 JSON으로 반환
router.get('/messages', async (req, res) => {
    console.log('Received request: GET /api/messages');
    try {
        const messages = await Message.find().sort({ createdAt: -1 }).lean();
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// POST /api/messages : 새 메시지를 생성
router.post('/messages', async (req, res) => {
    console.log('Received request: POST /api/messages with body:', req.body);
    try {
        const { name, date, mbti, memo, scores, tags, userAgent } = req.body;

        if (!name || !date || !mbti) {
            return res.status(400).json({ error: 'Name, date, and MBTI are required.' });
        }

        const newMessage = await Message.create({ 
            name, 
            date, 
            mbti, 
            memo,
            scores,
            tags,
            userAgent
        });
        
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ error: 'Error saving message' });
    }
});

// PATCH /api/messages/:id/like : 특정 메시지의 '좋아요'를 1 증가시킴
router.patch('/messages/:id/like', async (req, res) => {
    try {
        const messageId = req.params.id; // URL에서 메시지 ID를 가져옵니다.

        // DB에서 해당 ID의 문서를 찾아 'likes' 필드를 1 증가시킵니다.
        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            { $inc: { likes: 1 } }, // $inc는 숫자를 증가시키는 MongoDB 연산자입니다.
            { new: true } // 이 옵션은 업데이트된 후의 문서를 반환하도록 합니다.
        );

        if (!updatedMessage) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.status(200).json(updatedMessage); // 업데이트된 메시지 정보를 응답으로 보냅니다.
    } catch (error) {
        console.error('Error updating likes:', error);
        res.status(500).json({ error: 'Error updating likes' });
    }
});

module.exports = router;
