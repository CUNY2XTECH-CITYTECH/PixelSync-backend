import express from 'express';
import { admin, db } from '../firebase/firebaseAdmin.js';
import { BoardService } from '../services/boardService.js';

const router = express.Router();

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  const idToken = req.cookies.authToken || req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    return res.redirect('/auth/login');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.redirect('/auth/login');
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: userDoc.data().name
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.redirect('/auth/login');
  }
};

// Apply authentication middleware to all dashboard routes
router.use(authenticateUser);

router.get('/', async (req, res) => {
  try {
    const boards = await BoardService.getUserBoards(req.user.uid);
    res.render('dashboard', { user: req.user, boards });
  } catch (err) {
    console.error('Error fetching boards:', err);
    res.render('dashboard', { user: req.user, boards: [] });
  }
});

// // Handle board creation
// router.post('/create-board', (req, res) => {
//   const { boardName, classCode, tags } = req.body;

//   console.log('Creating new board:', {
//     name: boardName,
//     class: classCode,
//     tags: tags,
//     createdBy: req.user.uid
//   });

//   // Here you would typically:
//   // 1. Validate the input data
//   // 2. Generate a unique board ID
//   // 3. Save to database with user info
//   // 4. Redirect to the whiteboard with the new board ID

//   // For now, let's just redirect to whiteboard
//   // You can pass data via query parameters temporarily
//   const queryParams = new URLSearchParams({
//     name: boardName,
//     class: classCode,
//     tags: tags
//   });

//   res.redirect(`/whiteboard?${queryParams}`);
// });

// Handle board creation
router.post('/create-board', async (req, res) => {
  const { boardName, classCode, tags } = req.body;

  try {
    // Actually create the board in Firestore!
    await BoardService.createBoard(req.user.uid, { boardName, classCode, tags });

    // Redirect to whiteboard as before
    const queryParams = new URLSearchParams({
      name: boardName,
      class: classCode,
      tags: tags
    });
    res.redirect(`/whiteboard?${queryParams}`);
  } catch (err) {
    console.error('Error creating board:', err);
    res.redirect('/dashboard');
  }
});

// Save board data (image thumbnail + full editable data)
router.post('/save-board', async (req, res) => {
  const { name, image, drawing, writing, writingWindow } = req.body;

  try {
    const boardsRef = db.collection('boards');
    const snapshot = await boardsRef
      .where('userId', '==', req.user.uid)
      .where('boardName', '==', name)
      .limit(1)
      .get();

    let docRef;
    if (!snapshot.empty) {
      docRef = snapshot.docs[0].ref;
      await docRef.update({
        image: image || admin.firestore.FieldValue.delete(),  // optional thumbnail
        drawing: drawing || [],
        writing: writing || [],
        writingWindow: writingWindow || null,
        updatedAt: new Date()
      });
    } else {
      // create if missing
      docRef = await boardsRef.add({
        userId: req.user.uid,
        boardName: name,
        image: image || null,
        drawing: drawing || [],
        writing: writing || [],
        writingWindow: writingWindow || null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error saving board:', err);
    res.status(500).json({ success: false, error: 'save_failed' });
  }
});



// Get full board data for editing (not just the image)
router.get('/get-board-data', async (req, res) => {
  const { name } = req.query;

  try {
    const boardsRef = db.collection('boards');
    const snapshot = await boardsRef
      .where('userId', '==', req.user.uid)
      .where('boardName', '==', name)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ image: null, drawing: [], writing: [], writingWindow: null });
    }

    const board = snapshot.docs[0].data();
    res.json({
      image: board.image || null,        // thumbnail for dashboard
      drawing: board.drawing || [],      // array of points
      writing: board.writing || [],      // [{text,color,size,font}], etc.
      writingWindow: board.writingWindow || null
    });
  } catch (err) {
    console.error('Error fetching board data:', err);
    res.status(500).json({ image: null, drawing: [], writing: [], writingWindow: null });
  }
});



export default router;