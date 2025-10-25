import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const authMiddleware = (roles = []) => {
    // roles can be array like ['student', 'admin']
    return (req, res, next) => {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            const err = new Error('Token Missing');
            err.status = 401;
            err.clientMessage = 'Session timeout.';
            return next(err);
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;

            if (roles.length && !roles.includes(decoded.role)) {
                const err = new Error('Access denied');
                err.status = 403;
                err.clientMessage = 'Unauthorized Access';
                return next(err);
            }

            next();
        } catch (error) {
            const err = new Error('Session Expired');
            err.status = 400;
            err.clientMessage = 'Session Expired.';
            return next(err);
        }
    };
};
