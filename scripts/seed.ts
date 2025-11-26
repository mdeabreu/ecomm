import { seed } from '@/endpoints/seed'
import payload, { createLocalReq, SanitizedConfig } from 'payload'

export const script = async (config: SanitizedConfig) => {
  await payload.init({config})

  const req = await createLocalReq({}, payload)

  await seed({payload, req})
}