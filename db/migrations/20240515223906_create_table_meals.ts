import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('meals', (table) => {
        table.uuid('id').primary()
        table.text('userId').notNullable()
        table.text('name').notNullable()
        table.text('description')
        table.timestamp('created_at').notNullable()
        table.boolean('isOnDiet')
    })
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('meals')
}

