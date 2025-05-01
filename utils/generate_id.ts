import { v5 as uuidv5 } from 'uuid'

export const generateUniqueId = (user_id, event_id, timestamp) => {
    const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
    return uuidv5(`${user_id}_${event_id}_${timestamp}`, namespace)
}