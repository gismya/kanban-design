import { v } from 'convex/values'
import { CORE_LANE_IDS, CORE_LANE_LABELS, DEFAULT_PROJECT_LANES } from '../../shared/lanes'
import { PROJECT_ROLES, TASK_PRIORITIES } from '../../shared/domain'
import type { ProjectRole, TaskPriority } from '../../shared/domain'

export { CORE_LANE_IDS, CORE_LANE_LABELS, DEFAULT_PROJECT_LANES }
export { PROJECT_ROLES, TASK_PRIORITIES }
export type CoreLaneId = (typeof CORE_LANE_IDS)[number]
export type { ProjectRole, TaskPriority }

export const taskStatusValidator = v.string()

export const projectLaneValidator = v.object({
  id: v.string(),
  name: v.string(),
})

export const projectLanesValidator = v.array(projectLaneValidator)

const [lowPriority, mediumPriority, highPriority, urgentPriority] = TASK_PRIORITIES
const [ownerRole, adminRole, memberRole] = PROJECT_ROLES

export const taskPriorityValidator = v.union(
  v.literal(lowPriority),
  v.literal(mediumPriority),
  v.literal(highPriority),
  v.literal(urgentPriority),
)

export const projectRoleValidator = v.union(v.literal(ownerRole), v.literal(adminRole), v.literal(memberRole))
