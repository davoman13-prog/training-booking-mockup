import { Trainer } from '../types'

export function trainerFullName(trainer?: Trainer) {
  if (!trainer) return 'To be confirmed'
  return `${trainer.firstName} ${trainer.lastName}`
}
