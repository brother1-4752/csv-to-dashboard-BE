const connection = require("../db");

const getTestData = () => {
  return new Promise((resolve, reject) => {
    //TODO: 추후 실제 테이블과 특정 조건절 추가
    connection.query("SELECT * FROM users", (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

module.exports = {
  getTestData,
};
