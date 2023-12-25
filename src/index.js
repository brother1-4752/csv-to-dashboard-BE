const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const os = require("os-utils");
const bodyParser = require("body-parser");
const multer = require("multer");
const createTotalArray = require("./controller");

const app = express();
const port = 3000;

const uploadDir = path.join(__dirname, "../uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + ".csv");
  },
});

const upload = multer({ storage: storage });

// uploads 디렉토리 경로 설정

const clearUploadsDir = () => {
  try {
    // uploads 디렉토리 안의 파일들을 모두 삭제
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

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/upload", (req, res) => {
  res.send("upload");
});

app.post("/upload", upload.array("files"), async (req, res) => {
  const uploadStartTime = new Date();
  const files = req.files;

  const response = await createTotalArray(files);

  os.cpuUsage((cpuUsage) => {
    const uploadEndTime = new Date();
    const uploadTime = uploadEndTime - uploadStartTime;

    const status = {
      memoryUsage: process.memoryUsage(), // 메모리 사용량
      cpuUsage: cpuUsage * 100, // CPU 사용량을 백분율로 변환
      uploadTime: uploadTime / 1000, // 업로드 시간
      files: files,
    };

    res.json(status);
  });
});

app.listen(port, () => {
  console.log(`heurm server is listening to port ${port}`);
});
