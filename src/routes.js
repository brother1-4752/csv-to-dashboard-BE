const express = require("express");
const multer = require("multer");
const csvParser = require("csv-parser");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const UPLOAD_DIR = path.join("uploads");

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, UPLOAD_DIR);
  },
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// 파일리스트 변수 설정
// 업로드된 파일을 저장할 배열 변수 설정
let fileList = [];
let processedData = [];

// uploads 파일 초기화
const clearUploadsDir = () => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    files.forEach((file) => {
      const filePath = path.join(UPLOAD_DIR, file);
      fs.unlinkSync(filePath);
    });
    console.log("Uploads 디렉토리 초기화 완료.");
  } catch (error) {
    console.error("Uploads 디렉토리 초기화 오류:", error);
  }
};
clearUploadsDir();

// 파일 업로드 API 구현
router.post("/upload", upload.array("files", 500), (req, res) => {
  // fileList 초기화
  if (fileList.length > 0) fileList = [];

  fileList = Array.from(req.files);
  console.log("파일 업로드 완료");
  res.json({ fileList });
});

// 파일 처리 API 구현
router.post("/processing", async (req, res) => {
  // processedData 초기화
  if (processedData.length > 0) processedData = [];

  const processFile = (fileStream, callback) => {
    // let currentBatch = [];

    fileStream
      .pipe(csvParser())
      .on("data", (row) => {
        // currentBatch.push(row);
        processedData.push(row);

        // if (currentBatch.length === batchSize) {
        //   processedData.push(currentBatch);
        //   currentBatch = [];
        // }
      })
      .on("end", () => {
        // if (currentBatch.length > 0) {
        //   processBatch(currentBatch);
        // }

        callback();
      })
      .on("error", (error) => {
        console.error("Error reading/parsing file:", error);
        callback(error);
      });
  };

  // 작은 배치에 대한 가공 함수
  //   const processBatch = (batch) => {
  //     // 현재 배치에 대한 가공 및 작업 수행
  //     // console.log("Processing batch:", batch);
  //     const processedBatch = batch.map((row) => {
  //       // 가공 작업 수행 (예시로 각 데이터에 'Processed' 문자열 추가)
  //       return { ...row, processed: "Processed" };
  //     });

  //     // 결과 배열에 현재 배치 추가
  //     processedData.push(...processedBatch);
  //   };

  // 각 파일을 처리하는 Promise를 생성
  const fileProcessingPromises = fileList.map((file) => {
    const filePath = "uploads/" + file.originalname;
    const fileStream = fs.createReadStream(filePath);
    // const batchSize = 100;

    return new Promise((resolve, reject) => {
      processFile(fileStream, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  });

  // 모든 파일 처리가 완료되면 결과를 반환
  Promise.all(fileProcessingPromises)
    .then(() => {
      try {
        console.log("파일 처리 완료");
        res.json(processedData);
      } catch (err) {
        console.error("Error converting data to JSON:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    })
    .catch((error) => {
      console.error("Error processing files:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});

// 검색 API 구현
router.post("/search", (req, res) => {
  const userId = req.body.userId;
  const appsKey = "customer_user_id";
  const amplKey = "user_id";

  const filteredData = processedData.filter((data) => {
    return data["customer_user_id"] === userId || data["user_id"] === userId;
  });

  console.log("검색 완료");
  res.json({ filteredData });
});

module.exports = router;
