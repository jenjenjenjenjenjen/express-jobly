"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
    //Create a job (from data), update db, return new job data.

    //data should be { id, title, salary, equity, company_handle }

    //Returns { id, title, salary, equity, company_handle }

    static async create({ title, salary, equity, company_handle }) {
        const result = await db.query(
            `INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                title,
                salary,
                equity,
                company_handle
            ]
        );
        const job = result.rows[0];
        return job;
    }

    //Find all jobs
    //Returns { id, title, salary, equity, companyHandle }

    static async findAll(title = null, minSalary = null, hasEquity = false) {
        let query = `SELECT id, title, salary, equity, company_handle AS "companyHandle"
                    FROM jobs WHERE`;
        let params = [];

        if (title !== null) {
            title = '%' + title + '%';
            query = query + ` title ILIKE $1`;
            params = [title];

            if (minSalary !== null) {
                query = query + ` AND salary >= $2`;
                params = [title, Number(minSalary)];

                if (hasEquity === true) {
                    query = query + ` AND equity > 0`;
                };
            };
        };
        if (title === null && minSalary !== null) {
            query = query + ` salary >= $1`;
            params = [Number(minSalary)];

            if(hasEquity === true){
                query = query + ` AND equity > 0`;
            };
        };
        if (title === null && minSalary === null && hasEquity === true) {
            query = query + ` equity > 0`;
        };
        if (title === null && minSalary === null && hasEquity === false) {
            const results = await db.query(
                `SELECT id, title, salary, equity, company_handle AS "companyHandle"
                FROM jobs
                ORDER BY title`
            )
            return results.rows;
        };
        const jobs = await db.query(query, params);
        return jobs.rows;
    }

    //Given a job id, return information about the job
    //Returns { id, title, salary, equity, companyHandle }
    //Throws notFoundError if no such job

    static async get(id) {
        const results = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id=$1`,
            [id]
        );
        const job = results.rows[0];

        if (!job) throw new NotFoundError(`No job with id of ${id}`);

        return job;
    }

    //Update job data with "data".
    //Data can include: { title, salary, equity }
    //Returns: { id, title, salary, equity, companyHandle }
    //Throws notFoundError if no matching job is found

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                title: "title",
                salary: "salary",
                equity: "equity"
            }
        );
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
                          SET ${setCols}
                          WHERE id = ${idVarIdx}
                          RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with id of ${id}`);

        return job;
    }

    //Delete given job from database
    //Throws notFoundError if no such job

    static async remove(id) {
        const result = await db.query(
            `DELETE
             FROM jobs
             WHERE id = $1
             RETURNING id`,
          [id]);
      const job = result.rows[0];
  
      if (!job) throw new NotFoundError(`No job with id of ${id}`);
    }
}

module.exports = Job;