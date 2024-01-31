const express = require("express");
const db = require("./doc-db");

const router = express.Router();
let filteredDataList = [];
let columnsList = [];

const fetchDocuments = async (db, collectionName, query) => {
  let documents = [];
  let cursor = db.collection(collectionName).find(query).batchSize(1000);

  while (await cursor.hasNext()) {
    const batchDocuments = await cursor.next();
    documents = documents.concat(batchDocuments);

    if (documents.length >= 1000) {
      break;
    }
  }

  return documents;
};

// 검색 API 구현
router.post("/search", async (req, res) => {
  const serviceName = req.body.serviceName;
  const userId = req.body.userId;
  const sessionId = req.body.session_id;
  const targetDate = req.body.targetDate;

  if (columnsList.length > 0) {
    console.log("컬럼 비우기 완료");
    columnsList = [];
  }

  if (filteredDataList.length > 0) {
    console.log("데이터 비우기 완료");
    filteredDataList = [];
  }

  const collectionTypes = [
    // 추후 컬렉션에 데이터 적재 완료시, 아래 코드로 변경
    `${serviceName === "hiver" ? "t_amplitude_h" : "t_amplitude_b"}`,
    "t_conversions_retargeting_b",
    "t_installs_b",
  ];

  for (const type of collectionTypes) {
    columns = await db.collection(type).findOne();
    console.log(type, "컬럼수", Object.keys(columns).length);
    columnsList.push(...Object.keys(columns));
  }

  const collections = await db.db.listCollections().toArray();
  const collectionsNameList = collections.map((collection) => {
    if (serviceName === "hiver" && collection.name.includes("_h")) {
      return collection.name;
    } else if (serviceName === "brandi" && collection.name.includes("_b")) {
      return collection.name;
    } else {
      return;
    }
  });

  const filteredCollectionsNameList = collectionsNameList.filter(
    (collection) => collection !== undefined && collection !== "meta_batch_log"
  );

  try {
    console.log(filteredCollectionsNameList);

    console.time("검색 시간");
    for (const collectionName of filteredCollectionsNameList) {
      if (collectionName) {
        const docCounts = await db.collection(collectionName).countDocuments();

        if (docCounts === 0) continue;

        console.log(collectionName, "검색 시작", new Date());
        console.log(collectionName, "총 문서 수", docCounts);

        // 디비 내 컬렉션 순회하고 유저 아이디와 일치하는 데이터 읽어온 후
        (async () => {
          const query = {
            $or: [{ user_id: userId }, { customer_user_id: userId }],
            session_id: sessionId,
            $and: [
              { event_time_kst: { $gte: `${targetDate} 00:00:00` } },
              { event_time_kst: { $lte: `${targetDate} 23:59:59` } },
            ],
          };

          const result = await fetchDocuments(db, collectionName, query);

          filteredDataList.push(...result);
        })();

        console.log(collectionName, "검색 종료", new Date());
      }
      console.log("검색 완료", new Date());
    }
  } catch (error) {
    console.error(error);
  }
  console.timeEnd("검색 시간");

  res.json({ dataList: filteredDataList, columnsList });
});

module.exports = router;
