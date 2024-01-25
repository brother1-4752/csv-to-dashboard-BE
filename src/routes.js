const express = require("express");
const db = require("./doc-db");

const router = express.Router();
let filteredDataList = [];
let columnsList = [];

// 검색 API 구현
router.post("/search", async (req, res) => {
  const serviceName = req.body.serviceName;

  if (columnsList.length > 0) {
    console.log("컬럼 비우기 완료");
    columnsList = [];
  }

  const collectionTypes = [
    `${serviceName === "hiver" ? "t_amplitude_h" : "t_amplitude_b"}`,
    "t_conversions_retargeting_h",
    "t_installs_h",
  ];

  for (const type of collectionTypes) {
    const columns = await db.collection(type).findOne();
    console.log(type, "컬럼수", Object.keys(columns).length);
    columnsList.push(...Object.keys(columns));
  }

  if (filteredDataList.length > 0) {
    console.log("데이터 비우기 완료");
    filteredDataList = [];
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
    (collection) => collection
  );
  const userId = req.body.userId;

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
        // event_time 기준으로 정렬 후 변수화

        const result = await db
          .collection(collectionName)
          .find({
            $or: [{ customer_user_id: userId }, { user_id: userId }],
          })
          .sort({ event_time: -1 })
          .toArray();
        filteredDataList.push(...result);

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
