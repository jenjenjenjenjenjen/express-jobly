"use strict";

const { underline } = require("colors");
const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("create", function() {
    const newJob = {
        title: "new",
        salary: 100,
        equity: 1.0,
        company_handle: "c1"
    };
    test("works", async function() {
    
        let job = await Job.create(newJob);
        expect(job).toEqual({
            title: "new",
            salary: 100,
            equity: "1",
            companyHandle: "c1",
            id: expect.any(Number)
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id=${job.id}`
        );
        expect(result.rows).toEqual([
            {
                id: expect.any(Number),
                title: "new",
                salary: 100,
                equity: "1",
                companyHandle: "c1"
            }
        ]);
    });
});

describe("findAll", function() {
    test("works: no filter", async function() {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "test",
                salary: 10,
                equity: "1.0",
                companyHandle: 'c1'
            },
            {
                id: expect.any(Number),
                title: "test2",
                salary: 20,
                equity: "1.0",
                companyHandle: 'c2'
            }
        ]);
    });
});

describe("findFiltered", function() {
    test("works: only title", async function() {
        let jobs = await Job.findAll('2');
        expect(jobs).toEqual([{
            id: expect.any(Number),
            title: 'test2',
            salary: 20,
            equity: "1.0",
            companyHandle: 'c2'
        }]);
    })
    test("works: title and minSalary", async function() {
        let jobs = await Job.findAll('test', 20);
        expect(jobs).toEqual([{
            id: expect.any(Number),
            title: 'test2',
            salary: 20,
            equity: "1.0",
            companyHandle: 'c2'
        }]);
    })
    test("works: title, minSalary and hasEquity", async function() {
        let jobs = await Job.findAll('test', 20, true);
        expect(jobs).toEqual([{
            id: expect.any(Number),
            title: 'test2',
            salary: 20,
            equity: "1.0",
            companyHandle: 'c2'
        }]);
    })
    test("works: minSalary", async function() {
        let jobs = await Job.findAll(undefined, 20);
        expect(jobs).toEqual([{
            id: expect.any(Number),
            title: 'test2',
            salary: 20,
            equity: "1.0",
            companyHandle: 'c2'
        }]);
    })
    test("works: minSalary and hasEquity", async function() {
        let jobs = await Job.findAll(undefined, 20, true);
        expect(jobs).toEqual([{
            id: expect.any(Number),
            title: 'test2',
            salary: 20,
            equity: "1.0",
            companyHandle: 'c2'
        }]);
    })
    test("works: hasEquity", async function() {
        let jobs = await Job.findAll(undefined, undefined, true);
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: 'test',
                salary: 10,
                equity: '1.0',
                companyHandle: 'c1'
            },
            {
                id: expect.any(Number),
                title: 'test2',
                salary: 20,
                equity: "1.0",
                companyHandle: 'c2'
            }
        ]);
    })
    test("works: title and hasEquity", async function() {
        let jobs = await Job.findAll('2', undefined, true);
        expect(jobs).toEqual([{
            id: expect.any(Number),
            title: 'test2',
            salary: 20,
            equity: "1.0",
            companyHandle: 'c2'
        }]);
    })
})

describe("get", function() {
    test("works", async function() {
        let queryJob = await db.query(`SELECT id FROM jobs WHERE title='test'`);
        let job = await Job.get(queryJob.rows[0].id);
        expect(job).toEqual({
            id: queryJob.rows[0].id,
            title: "test",
            salary: 10,
            equity: "1.0",
            companyHandle: 'c1'
        });
    });
    test("not found if no such job", async function() {
        try {
            await Job.get(undefined);
            fail();
          } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
          }
    });
});

describe("update", function() {
    test("works", async function() {
        const updateData = {
            title: "new title",
            salary: 20,
            equity: 0.5
        };
        let queryJob = await db.query(`SELECT id FROM jobs WHERE title='test'`);
        let job = await Job.update(queryJob.rows[0].id, updateData);
        expect(job).toEqual({
            id: queryJob.rows[0].id,
            title: "new title",
            salary: 20,
            equity: "0.5",
            companyHandle: 'c1'
        });

        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id=${queryJob.rows[0].id}`
        );
        expect(result.rows).toEqual([{
            title: "new title",
            salary: 20,
            equity: "0.5",
            companyHandle: 'c1'
        }]);
    });
    test("works: null fields", async function() {
        const updateData = {
            title: "new title",
            salary: null,
            equity: null
        };
        let queryJob = await db.query(`SELECT id FROM jobs WHERE title='test'`);
        let job = await Job.update(queryJob.rows[0].id, updateData);
        expect(job).toEqual({
            id: queryJob.rows[0].id,
            title: "new title",
            salary: null,
            equity: null,
            companyHandle: 'c1'
        });

        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id=${queryJob.rows[0].id}`
        );
        expect(result.rows).toEqual([{
            title: "new title",
            salary: null,
            equity: null,
            companyHandle: 'c1'
        }]);
    });
    test("not found if no such job", async function () {
        const updateData = {
            title: "new title",
            salary: null,
            equity: null
        };
        try {
          await Job.update(undefined, updateData);
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
    test("bad request with no data", async function () {
        let queryJob = await db.query(`SELECT id FROM jobs WHERE title='test'`);
        try {
          await Job.update(queryJob.rows[0].id, {});
          fail();
        } catch (err) {
          expect(err instanceof BadRequestError).toBeTruthy();
        }
      });
});

describe("remove", function() {
    test("works", async function() {
        let queryJob = await db.query(`SELECT id FROM jobs WHERE title='test'`);
        await Job.remove(queryJob.rows[0].id);
        const result = await db.query(
            `SELECT id FROM jobs WHERE id=${queryJob.rows[0].id}`
        );
        expect(result.rows.length).toEqual(0);
    });
    test("not found if no such job", async function () {
        try {
          await Job.remove(undefined);
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
      });
})