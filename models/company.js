"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(name = null, minEmployees = null, maxEmployees = null) {
    let query = `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
                FROM companies WHERE`;
    let params = [];

    if (name !== null) {
      name = '%' + name + '%';
      query = query + ` name ILIKE $1`;
      params = [name];
      if (minEmployees !== null) {
        query = query + ` AND num_employees >= $2`;
        params = [name, Number(minEmployees)];
        if (maxEmployees !== null) {
          if (Number(minEmployees) >= Number(maxEmployees)) {
            throw new BadRequestError("Minimum cannot exceed maximum!");
          }
          query = query + ` AND num_employees <= $3`;
          params = [name, Number(minEmployees), Number(maxEmployees)]
        }
      }
    }
    if (name === null && minEmployees !== null) {
      query = query + ` num_employees >= $1`;
      params = [Number(minEmployees)];
      if(maxEmployees !== null) {
        if (Number(minEmployees) >= Number(maxEmployees)) {
          throw new BadRequestError("Minimum cannot exceed maximum!");
        }
        query = query + ` AND num_employees <= $2`;
        params = [Number(minEmployees), Number(maxEmployees)]
      }
    }
    if (name === null && minEmployees === null && maxEmployees !== null) {
      query = query + ` num_employees <= $1`
      params = [Number(maxEmployees)];
    }
    if (name === null && minEmployees === null && maxEmployees === null) {
      query =
        `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
        FROM companies
        ORDER BY name`
      const companies = await db.query(query);
      return companies.rows;
    }
    const companies = await db.query(query, params);
    return companies.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           JOIN jobs ON companies.handle=jobs.company_handle
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
