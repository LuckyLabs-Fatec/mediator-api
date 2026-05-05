import { Router } from 'express'
import { preApprovalRouter } from '../modules/pre-approval/preApproval.route'
import { healthRouter } from '../modules/health/health.route'

const router = Router()

router.use(healthRouter)
router.use(preApprovalRouter)

export { router }
