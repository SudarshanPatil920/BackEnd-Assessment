import { Router, Request } from 'express';
import { createExperience, publishExperience, blockExperience, listPublishedExperiences, getExperienceById } from '../services/experienceService';
import { requireAuth, requireRole, requireOwnerOrAdmin } from '../middlewares/auth';
import { validateBody } from '../validators';
import { createExperienceSchema } from '../validators/experience';
import { validateQuery, experienceListQuerySchema } from '../validators/query';
import { AppError } from '../middlewares/errorHandler';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole('host', 'admin'),
  validateBody(createExperienceSchema),
  async (req, res, next) => {
    try {
      const { title, description, location, price, start_time } = req.body;
      const createdBy = req.user!.userId;
      const experience = await createExperience(title, description, location, price, start_time, createdBy);
      res.status(201).json(experience);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id/publish',
  requireAuth,
  requireOwnerOrAdmin(async (req: Request) => {
    const experienceId = parseInt(req.params.id);
    const experience = await getExperienceById(experienceId);
    if (!experience) {
      throw new AppError(404, 'NOT_FOUND', 'Experience not found');
    }
    return experience.created_by;
  }),
  async (req, res, next) => {
    try {
      const experienceId = parseInt(req.params.id);
      const experience = await publishExperience(experienceId);
      res.json(experience);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id/block',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const experienceId = parseInt(req.params.id);
      const experience = await blockExperience(experienceId);
      res.json(experience);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/',
  validateQuery(experienceListQuerySchema),
  async (req, res, next) => {
    try {
      const filters = req.query as unknown as Parameters<typeof listPublishedExperiences>[0];
      const result = await listPublishedExperiences(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
