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
            updatedAt: new Date()
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

    async searchUserBoards(userId, query) {
        const userBoards = await this.getUserBoards(userId);
        if (!query) {
            return userBoards;
        }

        const lowerCaseQuery = query.toLowerCase();

        return userBoards.filter(board => {
            const boardName = board.boardName ? board.boardName.toLowerCase() : '';
            const classCode = board.classCode ? board.classCode.toLowerCase() : '';
            const tags = board.tags ? board.tags.toLowerCase() : '';

            return boardName.includes(lowerCaseQuery) ||
                   classCode.includes(lowerCaseQuery) ||
                   tags.includes(lowerCaseQuery);
        });
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