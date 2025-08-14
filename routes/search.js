import express from 'express';
import { BoardService } from '../services/boardService.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const userId = req.user.id;
    const { query } = req.query;
    try {
        const boards = await BoardService.searchUserBoards(userId, query);
        res.render('search', { boards, query });
    } catch (error) {
        console.error('Error searching boards:', error);
        res.status(500).send('Error searching boards');
    }
});

export default router;