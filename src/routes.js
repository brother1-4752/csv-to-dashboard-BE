const express = require("express");
const db = require("./doc-db");

const router = express.Router();
let filteredDataList = [];
let columnsList = [];
let columnFlagList = [];

// 검색 API 구현
router.post("/search", async (req, res) => {
  // 검색 조건에 따라 쿼리 생성
  const createQuery = () => {
    const query = {};

    if (req.body.userId.length > 0) {
      query.$or = [
        {
          user_id: req.body.userId,
          customer_user_id: req.body.userId,
        },
      ];
    }

    if (req.body.session_id.length > 0) {
      query.session_id = req.body.session_id;
    }

    if (req.body.productName.length > 0) {
      query.productName = req.body.productName;
    }

    if (req.body.productNo.length > 0) {
      query.productNo = req.body.productNo;
    }

    query.$and = [
      
    ]

    return query;
  };

  const query = createQuery();
  console.log("쿼리 : ", query);
  const serviceName = req.body.serviceName;

  if (columnsList.length > 0) {
    console.log("컬럼 비우기 완료");
    columnsList = [];
    columnFlagList = [];
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
    columnFlagList.push(Object.keys(columns)[0]);
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
    (collection) => collection !== undefined && collection !== "meta_batch_log"
  );

  try {
    console.log(filteredCollectionsNameList);

    console.time("검색 시간");
    for (const collectionName of filteredCollectionsNameList) {
      // for (const collectionName of ["t_inapps_b"]) {
      if (collectionName) {
        const docCounts = await db.collection(collectionName).countDocuments();

        if (docCounts === 0) {
          console.log(collectionName);
          continue;
        }

        console.log(collectionName, "검색 시작", new Date());
        console.log(collectionName, "총 문서 수", docCounts);

        // 디비 내 컬렉션 순회하고 유저 아이디와 일치하는 데이터 읽어온 후
        // event_time 기준으로 정렬 후 변수화

        const result = await db
          .collection(collectionName)
          .find(query)
          .sort({ event_time_kst: -1 })
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

  res.json({ dataList: filteredDataList, columnsList, columnFlagList });
});

module.exports = router;
