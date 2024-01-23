const express = require("express");
const db = require("./doc-db");
const createColumnList = require("./utils/createColumnList");

const router = express.Router();
let allData = [];

router.get("/columns", (req, res) => {
  const columnList = createColumnList();

  res.json({ columnList });
});

// 검색 API 구현
router.post("/search", async (req, res) => {
  if (allData.length > 0) { 
    console.log("데이터 비우기 완료");
    allData = [];
  }

  const test = createColumnList();

  const collections = await db.db.listCollections().toArray();
  const collectionsNameList = collections.map((collection) => collection.name);
  const userId = req.body.userId;

  try {
    console.log(collectionsNameList);

    console.time("검색 시간");
    for (const collectionName of collectionsNameList) {
      if (collectionName) {
        const docCounts = await db.collection(collectionName).countDocuments();

        console.log(collectionName, "검색 시작", new Date());
        console.log(collectionName, "총 문서 수", docCounts);

        // 디비 내 컬렉션 순회하고 유저 아이디와 일치하는 데이터 읽어온 후
        // event_time 기준으로 정렬 후 변수화
        const result = await db
          .collection(collectionName)
          .find({
            $or: [{ customer_user_id: userId }, { user_id: userId }],
          })
          .sort({ event_time: -1 })
          .toArray();
        allData.push(...result);

        console.log(collectionName, "검색 종료", new Date());
      }
      console.log("검색 완료", new Date());
    }
  } catch (error) {
    console.error(error);
  }
  console.timeEnd("검색 시간");

  // res.json({ list: allData.slice(0, 1000) });
  res.json({ list: test });
});

module.exports = router;
