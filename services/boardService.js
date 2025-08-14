import { db } from '../firebase/firebaseAdmin.js';

export const BoardService = {
    async createBoard (userId, boardData) {
        const boardRef = db.collection('boards').doc();
        const board = {
          boardId: boardRef.id,
          userId: userId,
          boardName: boardData.boardName,
          classCode: boardData.classCode,
          tags: boardData.tags,
          createdAt: new Date(),
          updatedAt: new Date(),
          drawing: [], // <-- add this
          writing: [], // <-- add this
          writingWindow: null // <-- add this
        };
        await boardRef.set(board);
        return board;
    },

    async getUserBoards(userId)  {
        const snapshot = await db.collection('boards')
            .where('userId', '==', userId)
            .orderBy('updatedAt', 'desc')
            .get();

        return snapshot.docs.map(doc => doc.data());
    },

    async deleteBoard (boardId, userId) {
        const boardRef = db.collection('boards').doc(boardId);
        const board = await boardRef.get();

        if (board.exists && board.data().userId === userId) {
            await boardRef.delete();
            return true;
        }
        return false;
    }
};