const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const csvParser = require("csv-parser");
const readline = require("readline");
const multer = require("multer");
const os = require("os-utils");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;
const DELAY_TIME = 1 * 60 * 1000; // 1분

const uploadDir = path.join(__dirname, "../uploads"); // uploads 디렉토리 경로 설정

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },
  filename: (req, file, callback) => {
    callback(null, file.fieldname + "-" + Date.now() + ".csv");
  },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/upload", upload.array("files"), async (req, res) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "파일 업로드 안됨." });
  }

  const results = [];

  const processFile = (file, callback) => {
    const parser = csvParser({
      headers: false,
    });

    fs.createReadStream(file.path)
      .pipe(parser)
      .on("data", (record) => {
        results.push(Object.values(record));
      })
      .on("end", () => {
        callback();
      })
      .on("error", (error) => {
        console.error("Error reading/parsing file:", error);
        callback(error);
      });
  };

  // 각 파일을 처리하는 Promise를 생성
  const fileProcessingPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      processFile(file, (error) => {
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
        res.json(results);
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

// 주기적인 파일 삭제 태스크
setInterval(() => {
  const uploadDir = path.join(__dirname, "../uploads");
  console.log(DELAY_TIME / 1000 / 60, "분 : ", "클렌징 워커 실행");
  // uploads 디렉토리 안의 파일들을 모두 삭제
  const clearUploadsDir = () => {
    try {
      const files = fs.readdirSync(uploadDir);
      files.forEach((file) => {
        const filePath = path.join(uploadDir, file);
        fs.unlinkSync(filePath);
      });

      console.log("Uploads 디렉토리 초기화 완료.");
    } catch (error) {
      console.error("Uploads 디렉토리 초기화 오류:", error);
    }
  };

  clearUploadsDir();
}, DELAY_TIME); // 1분 간격으로 실행

app.listen(port, () => {
  console.log(`heurm server is listening to port ${port}`);
});
