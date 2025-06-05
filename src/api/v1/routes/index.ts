import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import organizationRoutes from './organization.routes';
import hospitalAdminRoutes from './hospitalAdmin.routes';
import pharmaAdminRoutes from './pharmaAdmin.routes';
import labAdminRoutes from './labAdmin.routes';
import logger from '@/utils/logger.utils'; 
// Import other resource routes here as they are created
// import patientRoutes from './patient.routes';

const router = Router();

router.use((req, res, next) => {
    logger.debug(`V1 ROUTER: Path - ${req.path}, OriginalURL - ${req.originalUrl}, BaseURL - ${req.baseUrl}`);
    next();
});

// Mount auth routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/organizations', organizationRoutes); 
router.use('/hospital-admin', hospitalAdminRoutes); 
router.use('/pharma-admin', pharmaAdminRoutes);
router.use('/lab-admin', labAdminRoutes);

// Mount other resource routes
// router.use('/patients', patientRoutes);
// router.use('/organizations', organizationRoutes);

export default router;