import { courses, sessions, trainers } from '../data/mockData'
import { Trainer } from '../types'

export function trainerFullName(trainer?: Trainer) {
  if (!trainer) return 'To be confirmed'
  return `${trainer.firstName} ${trainer.lastName}`
}

export function findTrainer(trainerId?: string) {
  return trainers.find((trainer) => trainer.id === trainerId)
}

export function trainerNameById(trainerId?: string) {
  return trainerFullName(findTrainer(trainerId))
}

export function courseNameById(courseId: string) {
  return courses.find((course) => course.id === courseId)?.title ?? courseId
}

export function trainerSessionCounts(trainerId: string) {
  const trainerSessions = sessions.filter((session) => session.trainerId === trainerId)

  return {
    upcoming: trainerSessions.filter((session) => session.status === 'scheduled').length,
    completed: trainerSessions.filter((session) => session.status === 'completed').length,
    cancelled: trainerSessions.filter((session) => session.status === 'cancelled').length,
  }
}
