import { FastifyReply, FastifyRequest } from 'fastify'
import { knex } from '../database'

export async function checkSessionIdExists(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  
  if (!request.cookies.sessionId) {
    return reply.status(401).send({
      error: 'no user logged.',
    })
  }

  const user = await knex('users').where('id', request.cookies.sessionId).select()

  if (user.length === 0){
    return reply.status(401).send({
      error: 'no user found.',
    })
  }
}
