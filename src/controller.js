const fs = require("fs");
const readline = require("readline");

const createTotalArray = async (csvFileList) => {
  let totalArray = [];

  try {
    for (const csvFile of csvFileList) {
      // csvFile이 객체이고 path 프로퍼티가 있는 경우
      const filePath = typeof csvFile === "object" && csvFile.path;

      if (!filePath) {
        throw new Error("Invalid file object");
      }

      // 파일 스트림 생성
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      // 각 로우를 읽어서 배열에 추가
      const rows = [];
      for await (const line of rl) {
        rows.push(line);
      }

      // 해당 파일의 로우 배열을 totalArray에 추가
      totalArray.push(rows);
    }
    return totalArray;
  } catch (err) {
    console.log(err);
    throw err; // 에러를 호출자에게 전파
  }
};

module.exports = createTotalArray;
