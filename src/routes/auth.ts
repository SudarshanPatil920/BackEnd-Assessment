import { Router } from 'express';
import { signup, login } from '../services/authService';
import { validateBody } from '../validators';
import { signupSchema, loginSchema } from '../validators/auth';

const router = Router();

router.post('/signup', validateBody(signupSchema), async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const user = await signup(email, password, role);
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    next(error);
  }
});

router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
