import { auth } from '../firebase/firebaseAdmin.js';

export const ensureAuthenticated = (req, res, next) => {
    const idToken = req.cookies.idToken;
    if (!idToken) {
        return res.redirect('/auth/login');
    }

    auth.verifyIdToken(idToken)
        .then((decodedToken) => {
            req.user = {
                id: decodedToken.uid,
                email: decodedToken.email
            };
            next();
        })
        .catch((error) => {
            console.error('Error verifying ID token:', error);
            res.redirect('/auth/login');
        });
};
