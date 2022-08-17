const { sqlForPartialUpdate } = require('./sql');

describe("sqlForParialUpdate", function () {
    test("returns object of setCols and values", function () {
        const sql = sqlForPartialUpdate({testNum: 12, testText: "test"},
            {testNum: "test_num", testText: "test_text"});

        expect(sql).toEqual({ setCols: '"test_num"=$1, "test_text"=$2', values: [ 12, 'test' ] });
    });
})