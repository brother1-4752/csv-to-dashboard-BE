const express = require("express");
const multer = require("multer");
const csvParser = require("csv-parser");
const fs = require("fs");
const path = require("path");
const duplicatedHeaderKeys = require("./types/duplicatedHeaderKeys");

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
    console.log("Uploads 디렉토리 초기화 완료✅");
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
  console.log("파일 업로드 완료", new Date());
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
        console.log("파일 처리 완료", new Date());
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
  const filterType = req.body.filterType;

  //유저아이디와 일치하는 앱스플라이어 또는 앰플리튜드 데이터만 필터링
  const filteredData = processedData.filter((data) => {
    //필터 타입이 유저 아이디인 케이스
    if (filterType === "userId") {
      if (data["customer_user_id"]) {
        return data["customer_user_id"] === userId;
      }

      if (data["user_id"]) {
        return data["user_id"] === userId;
      }

      return false;
    }
  });

  //중복 헤더 컬럼값 유니크값으로 변환
  const dataRemovedDuplicatedHeaderKeys = filteredData.map((data) => {
    let refinedData = {};
    //앱스플라이어 데이터
    if (data["customer_user_id"]) {
      refinedData["tool_type"] = "appsFlyer";
      for (const key in data) {
        const newKey =
          duplicatedHeaderKeys.indexOf(key) !== -1 ? key + "__apps" : key;
        refinedData[newKey] = data[key];
      }
    }

    //앰플리튜드 데이터
    if (data["user_id"]) {
      refinedData["tool_type"] = "amplitude";
      for (const key in data) {
        const newKey =
          duplicatedHeaderKeys.indexOf(key) !== -1 ? key + "__ampl" : key;
        refinedData[newKey] = data[key];
      }
    }

    return refinedData;
  });

  // 각각 앰플 또는 앱스 객체를 병합하는 로직
  // const mergedData = dataRemovedDuplicatedHeaderKeys.map((data) => {
  //   if (data["customer_user_id"]) {
  //     //앱스플라이어 데이터
  //     const mergedWithAmplitude = { data, ...AmplitudeColumns };
  //     // const mergedWithAmplitude = { ...data };
  //     return mergedWithAmplitude;
  //   } else if (data["user_id"]) {
  //     // 앰플리튜드 데이터
  //     const mergedWithAppsFlyer = { ...appsFlyerColumns, data };
  //     // const mergedWithAppsFlyer = { ...data };
  //     return mergedWithAppsFlyer;
  //   } else {
  //     //그 외 데이터
  //     res.json({
  //       message:
  //         "파일에 앱스플라이어나 앰플리튜드가 아닌 것이 포함되어 있습니다.",
  //     });
  //   }
  // });

  console.log("검색 완료", new Date());
  res.json({ list: dataRemovedDuplicatedHeaderKeys });
});

module.exports = router;
