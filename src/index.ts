const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");

const readline = require("readline");
const multer = require("multer");
const os = require("os-utils");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

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

// uploads 디렉토리 안의 파일들을 모두 삭제
const clearUploadsDir = () => {
  try {
    const files = fs.readdirSync(uploadDir);
    files.forEach((file: File) => {
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

app.post("/upload", upload.array("files"), async (req, res) => {
  const uploadStartTime = new Date().getTime();
  const files = <FileList | null>req.files;

  createTotalArray(files);

  // for (const file of files) {
  //   // const rl = readline.createInterface({
  //   //   input: fs.createReadStream(file.buffer),
  //   //   crlfDelay: Infinity,
  //   // });

  //   const parser = fs.createReadStream(file.buffer).pipe(csvParser());
  //   const parsePromise = new Promise((resolve, reject) => {
  //     parser
  //       .on("data", (record) => results.push(record))
  //       .on("end", resolve)
  //       .on("error", reject);
  //   });

  //   await parsePromise;

  //   rl.pipe(parser);

  //   for await (const record of parser) {
  //     results.push(record);
  //   }
  // }

  // const response = await createTotalArray(files);

  os.cpuUsage((cpuUsage) => {
    const uploadEndTime = new Date().getTime();
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
