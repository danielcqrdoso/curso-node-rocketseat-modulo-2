import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
  // criar refeições
  app.post('/meals',     
    {
      preHandler: [checkSessionIdExists],
    }, 
    async (request, reply) => {
      const { sessionId } = request.cookies;

      const createTransactionBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isOnDiet: z.boolean(),
      })
  
      const { name, description, isOnDiet } = createTransactionBodySchema.parse(
        request.body,
      )
  
      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        isOnDiet,
        created_at: new Date(),
        userId: sessionId,
      })
  
      return reply.status(201).send()
    },
  )

  // editar refeições
  app.post('/meals/edit/:currentName',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getTransactionsParamsSchema = z.object({
        currentName: z.string(),
      })

      const { currentName } = getTransactionsParamsSchema.parse(request.params);

      const { sessionId } = request.cookies;

      const createTransactionBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        isOnDiet: z.boolean().optional(),
      })
  
      const { name, description, isOnDiet } = createTransactionBodySchema.parse(
        request.body,
      )

      await knex('meals').where({ userId: sessionId, name: currentName }).update({
        name,
        description,
        isOnDiet
      });

      return reply.status(200).send()
    },
  )

  // Mostar refeições
  app.get('/meals/:name?',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const getTransactionsParamsSchema = z.object({
        name: z.string().optional(),
      })

      const { name } = getTransactionsParamsSchema.parse(request.params);

      const { sessionId } = request.cookies;

      let query = knex('meals').where({ userId: sessionId });

      if (name) {
        query = query.andWhere({ name: name });
      }

      const meals = await query;

      return {
        meals,
      }
    },
  )

  // apagar refeição
  app.delete('/meals/:name',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getTransactionsParamsSchema = z.object({
        name: z.string(),
      })

      const { name } = getTransactionsParamsSchema.parse(request.params);

      const { sessionId } = request.cookies;

      const rowsAffected = await knex('meals').where({ userId: sessionId, name }).del();

      if (rowsAffected === 0) {
        return reply.status(404).send({ message: 'Meal not found' });
      }
  
      return reply.status(200).send();
    },
  )

  // Pegar métricas
  app.get('/meals/metrics',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies;

      const metrics = await knex('meals').where({ userId: sessionId });

      const totalMeals = metrics.length;

      const totalMealsOnDiet =  metrics.filter(item => item.isOnDiet).length;

      const totalMealsOutDiet = totalMeals - totalMealsOnDiet;

      let betterSequence: any[] = [];
      let currentSequence: any[] = [];

      metrics.forEach(element => {
        if (!element['isOnDiet']){
          currentSequence = []
        }else{
          currentSequence.push(element)
        }
        if (currentSequence.length > betterSequence.length){
          betterSequence = currentSequence;
        }
      });

      return {
        totalMeals,
        totalMealsOnDiet,
        totalMealsOutDiet,
        betterSequence,
      }
    },
  )

  // Fazer o login
  app.post('/login', async (request, reply) => {
      const createTransactionBodySchema = z.object({
        name: z.string(),
        password: z.string(),
      })

      const { name, password } = createTransactionBodySchema.parse(
        request.body,
      )

      const users = await knex('users').where({
        name,
        password
      }).select();

      if (users.length === 0){
        return reply.status(404).send({
          error: 'user not found',
        })
      }

      const sessionId = users[0]['id']
  
      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 30, // 30 minutos
      })

      return reply.status(200).send()
    },
  )

  // Criar user
  app.post('/users', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      name: z.string(),
      password: z.string(),
    })

    const { name, password } = createTransactionBodySchema.parse(
      request.body,
    )

    await knex('users').insert({
      id: randomUUID(),
      name,
      password,
    })

    return reply.status(201).send()
  })
}
