import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

async function doLogin(){
  await request(app.server)
    .post('/transactions/users')
    .send({
      name: 'New user',
      password: 'password',
    })

  const createTransactionResponse = await request(app.server)
    .post('/transactions/login')
    .send({
      name: 'New user',
      password: 'password',
    })

  return createTransactionResponse.get('Set-Cookie')
}

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new user', async () => {
    await request(app.server)
      .post('/transactions/users')
      .send({
        name: 'New user',
        password: 'password',
      })
      .expect(201)
  })

  it('should be able to create a new meals', async () => {
    const cookies = await doLogin();

    await request(app.server)
      .post('/transactions/meals')
      .set('Cookie', cookies)
      .send({
        name: 'meal',
        description: 'descrição',
        isOnDiet: true,
      })
      .expect(201)
  })

  it('should be able to get a specific meal', async () => {
    const cookies = await doLogin();
  
    await request(app.server)
      .post('/transactions/meals')
      .set('Cookie', cookies)
      .send({
        name: 'meal',
        description: 'descrição',
        isOnDiet: true,
      })

    const getMealsResponse = await request(app.server)
      .get(`/transactions/meals/meal`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getMealsResponse.body.meals[0]).toEqual(
      expect.objectContaining({
        id: getMealsResponse.body.meals[0]["id"],
        userId: getMealsResponse.body.meals[0]["userId"],
        created_at: getMealsResponse.body.meals[0]["created_at"],
        name: 'meal',
        description: 'descrição',
        isOnDiet: 1,
      }),
    )
  })

  it('should be able to edit a specific meal', async () => {
    const cookies = await doLogin();
  
    await request(app.server)
      .post('/transactions/meals')
      .set('Cookie', cookies)
      .send({
        name: 'meal',
        description: 'descrição',
        isOnDiet: true,
      })

    const getMealsResponse = await request(app.server)
      .get(`/transactions/meals/meal`)
      .set('Cookie', cookies)
      .expect(200)

    await request(app.server)
      .post(`/transactions/meals/edit/meal`)
      .set('Cookie', cookies)
      .send({
        name: 'newMeal',
        description: 'nova descrição',
        isOnDiet: false,
      })
      .expect(200)

    const getNewMealsResponse = await request(app.server)
      .get(`/transactions/meals/newMeal`)
      .set('Cookie', cookies)
      .expect(200)

    // Vê se os dados da antiga e nova refeição batem
    expect(getNewMealsResponse.body.meals[0]).toEqual(
      expect.objectContaining({
        id: getMealsResponse.body.meals[0]["id"],
        userId: getMealsResponse.body.meals[0]["userId"],
        created_at: getMealsResponse.body.meals[0]["created_at"],
        name: 'newMeal',
        description: 'nova descrição',
        isOnDiet: 0,
      }),
    )
  })

  it('should be able to delete a specific meal', async () => {
    const cookies = await doLogin();
  
    await request(app.server)
      .post('/transactions/meals')
      .set('Cookie', cookies)
      .send({
        name: 'meal',
        description: 'descrição',
        isOnDiet: true,
      })

    await request(app.server)
      .delete('/transactions/meals/meal')
      .set('Cookie', cookies)
      .expect(200)
  })

  it("shouldn't be able to delete a specific meal", async () => {
    const cookies = await doLogin();

    await request(app.server)
      .delete('/transactions/meals/meal')
      .set('Cookie', cookies)
      .expect(404)
  })

  it('should be able to get the metrics', async () => {
    const cookies = await doLogin();

    await request(app.server)
      .post('/transactions/meals')
      .set('Cookie', cookies)
      .send({
        name: 'meal',
        description: 'descrição',
        isOnDiet: true,
      })
      .expect(201)

    await request(app.server)
      .post('/transactions/meals')
      .set('Cookie', cookies)
      .send({
        name: 'meal2',
        description: 'descrição2',
        isOnDiet: false,
      })
      .expect(201)

    await request(app.server)
      .post('/transactions/meals')
      .set('Cookie', cookies)
      .send({
        name: 'meal3',
        description: 'descrição3',
        isOnDiet: false,
      })
      .expect(201)
    
    const metrics = await request(app.server)
      .get(`/transactions/meals/metrics`)
      .set('Cookie', cookies)
      .expect(200)

    expect(metrics.body).toEqual(
      expect.objectContaining({
        totalMeals: 3,
        totalMealsOnDiet: 1,
        totalMealsOutDiet: 2,
        betterSequence: expect.any(Array),
      }),
    )
  })
})
